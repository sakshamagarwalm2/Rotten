import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import mammoth from 'mammoth';
import { PptSettingsSchema, type PptSettings } from '../../../types/settings';
import { parseDoc } from '../../../services/docParser/parseDoc';
import { normalizeDoc } from '../../../services/docParser/normalizeDoc';
import { calculateLayout } from '../../../services/layoutEngine/calculateLayout';
import { generatePpt } from '../../../services/pptGenerator/generatePpt';
import { analyzeWithGroq, type AiDocument } from '../../../services/aiAnalyzer/slideAnalyzer';
import { logger } from '../../../utils/logger';

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'tmp', 'uploads');

export const runtime = 'nodejs';

const GenerateRequestSchema = z.object({
  uploadId: z.string().uuid(),
  settings: PptSettingsSchema,
});

const MAX_AI_ANALYSIS_CHARS = 9000;

function convertAiDocToParsedDoc(aiDoc: AiDocument): import('../../../services/docParser/parseDoc').ParsedDocument {
  let nextId = 1;
  return {
    sections: aiDoc.sections.map((section) => ({
      title: section.title || 'General',
      questions: section.questions.map((q) => ({
        id: nextId++,
        questionNo: q.questionNo || '',
        text: q.text || '',
        options: Array.isArray(q.options) ? q.options : [],
        year: q.year || undefined,
        answer: q.answer || undefined,
        images: Array.isArray(q.images) ? q.images : [],
      })),
    })),
  };
}

async function extractRawTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    const text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return text;
  } catch (error: any) {
    logger.error('[extractRawText] Failed to extract raw text:', error.message);
    return '';
  }
}

export async function POST(request: Request) {
  logger.section('PPT Generation Request');
  logger.info('[generate] POST handler ENTER');
  logger.info('[generate] request.url:', request.url);

  try {
    logger.info('[generate] Reading request body...');
    const body = await request.json();
    logger.debug('[generate] Raw body received:', JSON.stringify(body, null, 2));
    logger.info('[generate] body.uploadId:', body.uploadId);
    logger.info('[generate] body.settings present:', !!body.settings);

    logger.info('[generate] Parsing with Zod schema...');
    const parsed = GenerateRequestSchema.parse(body);
    const { uploadId, settings } = parsed;
    logger.info('[generate] Zod parse SUCCEEDED');
    logger.debug('[generate] settings:', JSON.stringify(settings, null, 2));

    const uploadDir = path.join(UPLOAD_BASE_DIR, uploadId);
    const metadataPath = path.join(uploadDir, 'metadata.json');
    logger.info('[generate] uploadDir:', uploadDir);
    logger.info('[generate] metadataPath:', metadataPath);

    const metadataRaw = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataRaw) as {
      docxPath: string;
      backgroundPath: string | null;
    };
    logger.info('[generate] metadata.docxPath:', metadata.docxPath);
    logger.info('[generate] metadata.backgroundPath:', metadata.backgroundPath);

    logger.info('[generate] Reading DOCX file...');
    const documentBuffer = await fs.readFile(metadata.docxPath);
    logger.info('[generate] documentBuffer size:', documentBuffer.length, 'bytes');

    logger.section('Document Parsing');
    logger.info('[generate] Using deterministic DOCX parser...');
    let parsedDocument = await parseDoc(documentBuffer, settings);
    let parsedQuestionCount = parsedDocument.sections.reduce((sum, section) => sum + section.questions.length, 0);
    logger.info('[generate] parseDoc returned', parsedDocument.sections.length, 'sections,', parsedQuestionCount, 'questions');
    logger.debug('[generate] parseDoc result:', JSON.stringify(parsedDocument, null, 2).substring(0, 2000));

    if (parsedQuestionCount === 0) {
      const rawTextForAi = await extractRawTextFromDocx(documentBuffer);
      logger.info('[generate] Raw text extracted for AI fallback:', rawTextForAi.length, 'chars');

      if (rawTextForAi.length > 50 && rawTextForAi.length <= MAX_AI_ANALYSIS_CHARS) {
        logger.section('AI Content Detection Attempt');
        const aiResult = await analyzeWithGroq(rawTextForAi, path.basename(metadata.docxPath));

        if (aiResult && aiResult.sections.length > 0) {
          const totalQuestions = aiResult.sections.reduce((sum, s) => sum + s.questions.length, 0);
          logger.info('[generate] AI detection SUCCEEDED:', aiResult.sections.length, 'sections,', totalQuestions, 'questions');
          logger.debug('[generate] AI result:', JSON.stringify(aiResult, null, 2));
          parsedDocument = convertAiDocToParsedDoc(aiResult);
          parsedQuestionCount = totalQuestions;
        } else {
          logger.warn('[generate] AI detection returned no useful content');
        }
      } else if (rawTextForAi.length > MAX_AI_ANALYSIS_CHARS) {
        logger.warn('[generate] Skipping AI fallback because document text exceeds safe token budget');
      } else {
        logger.warn('[generate] Raw text too short for AI analysis');
      }
    }

    logger.section('Document Normalization');
    logger.info('[generate] Calling normalizeDoc...');
    const normalizedDocument = normalizeDoc(parsedDocument);
    logger.info('[generate] normalizeDoc returned', normalizedDocument.sections.length, 'sections');
    logger.debug('[generate] normalizedDocument:', JSON.stringify(normalizedDocument, null, 2).substring(0, 2000));

    logger.section('Layout Calculation');
    logger.info('[generate] Calling calculateLayout...');
    const slides = calculateLayout(normalizedDocument, settings);
    logger.info('[generate] calculateLayout returned', slides.length, 'slides');
    if (slides.length > 0) {
      logger.info('[generate] first slide id:', slides[0].id, 'items:', slides[0].items.length);
      logger.info('[generate] last slide id:', slides[slides.length - 1].id, 'items:', slides[slides.length - 1].items.length);
    }

    logger.section('Background Handling');
    if (metadata.backgroundPath) {
      const bgExists = await fs.access(metadata.backgroundPath).then(() => true).catch(() => false);
      logger.info('[generate] backgroundPath exists:', bgExists);
      if (bgExists) {
        logger.info('[generate] Assigning backgroundPath to settings');
        settings.backgroundImage = metadata.backgroundPath;
      }
    } else {
      logger.info('[generate] No background image provided');
    }

    const outputFilePath = path.join(uploadDir, 'presentation.pptx');
    logger.info('[generate] outputFilePath:', outputFilePath);

    logger.section('PPT Generation');
    logger.info('[generate] Calling generatePpt with', slides.length, 'slides');
    const result = await generatePpt(slides, settings, outputFilePath);
    logger.info('[generate] generatePpt returned:', result);

    const fileBuffer = await fs.readFile(outputFilePath);
    logger.info('[generate] Generated file size:', fileBuffer.length, 'bytes');
    logger.section('Request Complete');
    logger.info('[generate] Returning PPTX response with status 200');

    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    });

    return response;
  } catch (error: any) {
    logger.section('Error');
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[generate] ERROR CAUGHT:', message);
    logger.error('[generate] error name:', error?.name || 'N/A');
    logger.error('[generate] error stack:', error?.stack || 'N/A');
    if (error instanceof z.ZodError) {
      logger.error('[generate] ZodError issues:', JSON.stringify(error.issues, null, 2));
    }
    logger.error('[generate] Returning 500 response');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
