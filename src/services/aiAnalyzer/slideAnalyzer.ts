import { groqChatCompletion } from './groqClient';
import { logger } from '../../utils/logger';

export interface AiQuestion {
  questionNo: string;
  text: string;
  options: string[];
  answer: string | null;
  year: string | null;
  images: string[];
}

export interface AiSection {
  title: string;
  questions: AiQuestion[];
}

export interface AiDocument {
  sections: AiSection[];
}

const SYSTEM_PROMPT = `You are an expert document analyzer specializing in extracting structured quiz/question content from educational documents.

Your task is to analyze the provided text from a DOCX file and extract all questions, options, answers, year tags, and section headings.

Rules:
1. Identify section headings (e.g., "SECTION A", "PART 1", "खंड क", etc.)
2. For each question, extract:
   - questionNo: The question number (e.g., "1", "2", etc.)
   - text: The question text (without the number prefix)
   - options: Array of option strings (A, B, C, D options)
   - answer: The correct answer if explicitly indicated (e.g., "उत्तर: विकल्प A" -> "A")
   - year: Year tag if present (e.g., "[2023]" -> "2023")
3. Group questions under their respective sections
4. If no section is detected, put all questions in a section titled "General"
5. Return ONLY valid JSON matching the required structure
6. Do NOT include any markdown formatting, code blocks, or extra text outside the JSON
7. Handle both Hindi and English content correctly
8. Preserve the original text as-is, do not translate or modify it

Expected JSON structure:
{
  "sections": [
    {
      "title": "Section Name",
      "questions": [
        {
          "questionNo": "1",
          "text": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "A",
          "year": "2023"
        }
      ]
    }
  ]
}`;

function extractJsonFromResponse(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  const clean = text.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '').trim();
  if (clean.startsWith('{') && clean.endsWith('}')) {
    return clean;
  }
  return text;
}

export async function analyzeWithGroq(
  rawText: string,
  docxFileName?: string,
): Promise<AiDocument | null> {
  logger.section('AI Slide Analyzer');
  logger.info(`[slideAnalyzer] Analyzing document: ${docxFileName ?? 'unknown'}`);
  logger.info(`[slideAnalyzer] Raw text length: ${rawText.length} chars`);
  logger.info(`[slideAnalyzer] Raw text preview (first 500 chars):`);
  logger.info(rawText.substring(0, 500));

  if (!rawText || rawText.trim().length < 20) {
    logger.warn('[slideAnalyzer] Text too short, skipping AI analysis');
    return null;
  }

  const userMessage = `Analyze the following document text and extract all questions with their options, answers, and year tags. Group them into sections where applicable.

Document text:
---
${rawText}
---`;

  const response = await groqChatCompletion([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]);

  if (!response) {
    logger.error('[slideAnalyzer] Groq returned no response');
    return null;
  }

  logger.info(`[slideAnalyzer] Raw response length: ${response.length} chars`);
  logger.debug('[slideAnalyzer] Raw response:', response);

  const jsonStr = extractJsonFromResponse(response);
  logger.debug('[slideAnalyzer] Extracted JSON:', jsonStr.substring(0, 500));

  try {
    const parsed = JSON.parse(jsonStr) as AiDocument;

    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      logger.error('[slideAnalyzer] Parsed JSON missing sections array');
      return null;
    }

    const validSections = parsed.sections.filter(s => {
      if (!s.title || !Array.isArray(s.questions)) {
        logger.warn('[slideAnalyzer] Skipping invalid section:', JSON.stringify(s));
        return false;
      }
      s.questions = s.questions.filter(q => {
        if (!q.text && !q.questionNo) {
          logger.warn('[slideAnalyzer] Skipping empty question:', JSON.stringify(q));
          return false;
        }
        return true;
      });
      return true;
    });

    const totalQuestions = validSections.reduce((sum, s) => sum + s.questions.length, 0);
    logger.info(`[slideAnalyzer] Successfully parsed: ${validSections.length} sections, ${totalQuestions} questions`);
    logger.debug('[slideAnalyzer] Full parsed result:', JSON.stringify({ sections: validSections }, null, 2));

    return { sections: validSections };
  } catch (error: any) {
    logger.error('[slideAnalyzer] Failed to parse Groq response as JSON:', error.message);
    logger.debug('[slideAnalyzer] Attempted to parse:', jsonStr);
    return null;
  }
}
