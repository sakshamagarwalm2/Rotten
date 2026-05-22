import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { PptSettingsSchema, type PptSettings } from '../../../types/settings';
import { parseDoc } from '../../../services/docParser/parseDoc';
import { normalizeDoc } from '../../../services/docParser/normalizeDoc';
import { calculateLayout } from '../../../services/layoutEngine/calculateLayout';
import { generatePpt } from '../../../services/pptGenerator/generatePpt';

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'tmp', 'uploads');

export const runtime = 'nodejs';

const GenerateRequestSchema = z.object({
  uploadId: z.string().uuid(),
  settings: PptSettingsSchema,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uploadId, settings } = GenerateRequestSchema.parse(body);

    const uploadDir = path.join(UPLOAD_BASE_DIR, uploadId);
    const metadataPath = path.join(uploadDir, 'metadata.json');

    const metadataRaw = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataRaw) as {
      docxPath: string;
      backgroundPath: string | null;
    };

    const documentBuffer = await fs.readFile(metadata.docxPath);
    const parseResult = await parseDoc(documentBuffer, settings);
    const normalizedDocument = normalizeDoc(parseResult);
    const slides = calculateLayout(normalizedDocument, settings);

    if (metadata.backgroundPath) {
      settings.backgroundImage = metadata.backgroundPath;
    }

    const outputFilePath = path.join(uploadDir, 'presentation.pptx');
    await generatePpt(slides, settings, outputFilePath);

    const fileBuffer = await fs.readFile(outputFilePath);
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PPT generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
