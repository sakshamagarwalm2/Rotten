import mammoth from 'mammoth';
import type { PptSettings } from '../../types/settings';
import { PptSettingsSchema } from '../../types/settings';

export interface Question {
  id: number;
  questionNo: string;
  text: string;
  options: string[];
  year?: string;
  answer?: string;
  images?: string[];
}

export interface Section {
  title: string;
  questions: Question[];
}

export interface ParsedDocument {
  sections: Section[];
}

const DEFAULT_SECTION_TITLE = 'General';

const questionPattern = /^(?:प्रश्न\s*)?(\d{1,3})([.)]|\s+)\s*(.*)$/i;
const optionPattern = /^([a-dA-D])\s*[.)]\s*(.*)$/;
const answerPattern = /उत्तर\s*[:\-–]?\s*(.+)$/i;
const yearPattern = /\[(\d{4})\]/;
const headingKeywords = [
  'SECTION',
  'खंड',
  'भाग',
  'विषय',
  'प्रश्न पत्र',
  'SET',
  'PART',
  'सत्र',
  'समूह',
  'पेपर',
  'अध्याय',
];

function normalizeHtmlToText(html: string): string {
  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '\n')
    .replace(/<\/th>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeHtmlEntities(withLineBreaks).replace(/\n{2,}/g, '\n');
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractBlockText(html: string): string {
  return normalizeHtmlToText(html).trim();
}

function isHeadingLine(line: string, blockHtml: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  if (headingKeywords.some((keyword) => trimmed.toUpperCase().includes(keyword.toUpperCase()))) {
    return true;
  }

  const containsBold = /<strong>|<b>/i.test(blockHtml);
  const isShort = trimmed.length <= 120 && trimmed.split(/\s+/).length <= 10;
  const notMetadata = !optionPattern.test(trimmed) && !answerPattern.test(trimmed) && !questionPattern.test(trimmed);

  return containsBold && isShort && notMetadata;
}

function toArrayBuffer(input: File | Blob | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
  if (input instanceof ArrayBuffer) {
    return Promise.resolve(input);
  }

  if (ArrayBuffer.isView(input)) {
    const view = input as ArrayBufferView;
    const sliced = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    return Promise.resolve(sliced as ArrayBuffer);
  }

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return input.arrayBuffer();
  }

  return Promise.reject(new Error('Unsupported file input type for parseDoc.'));
}

function splitTextIntoLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function extractImageSources(html: string): string[] {
  const sources: string[] = [];
  const imageRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = null;

  while ((match = imageRegex.exec(html)) !== null) {
    sources.push(match[1]);
  }

  return sources;
}

function extractBlocks(html: string): Array<{ text: string; html: string; images: string[] }> {
  const blocks: Array<{ text: string; html: string; images: string[] }> = [];
  const imageTagRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = imageTagRegex.exec(html)) !== null) {
    const beforeHtml = html.slice(lastIndex, match.index);
    if (beforeHtml.trim()) {
      blocks.push({
        html: beforeHtml,
        text: extractBlockText(beforeHtml),
        images: [],
      });
    }

    blocks.push({
      html: match[0],
      text: '',
      images: [match[1]],
    });

    lastIndex = imageTagRegex.lastIndex;
  }

  const remainder = html.slice(lastIndex);
  if (remainder.trim()) {
    blocks.push({
      html: remainder,
      text: extractBlockText(remainder),
      images: [],
    });
  }

  return blocks;
}

export async function parseDoc(
  file: File | Blob | ArrayBuffer | Uint8Array,
  settings?: PptSettings,
): Promise<ParsedDocument> {
  if (settings) {
    PptSettingsSchema.parse(settings);
  }

  const arrayBuffer = await toArrayBuffer(file);
  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(arrayBuffer);

  const mammothImages = (mammoth as any).images;
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammothImages.inline((image: any) =>
        image.read('base64').then((imageBuffer: string) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        })),
      ),
    },
  );

  const blocks = extractBlocks(html);
  const sections: Section[] = [
    {
      title: DEFAULT_SECTION_TITLE,
      questions: [],
    },
  ];
  let currentSection = sections[0];
  let currentQuestion: Question | null = null;
  let nextQuestionId = 1;

  const createQuestion = (questionNo = ''): Question => {
    const newQuestion: Question = {
      id: nextQuestionId++,
      questionNo,
      text: '',
      options: [],
    };
    currentSection.questions.push(newQuestion);
    currentQuestion = newQuestion;
    return newQuestion;
  };

  const appendTextToQuestion = (question: Question, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) {
      return;
    }

    question.text = question.text ? `${question.text}\n${cleanText}` : cleanText;
  };

  const appendImageToQuestion = (question: Question, src: string) => {
    if (!question.images) {
      question.images = [];
    }
    question.images.push(src);
  };

  const addOrAttachImage = (src: string) => {
    if (currentQuestion) {
      appendImageToQuestion(currentQuestion, src);
      return;
    }
    const orphanQuestion = createQuestion('');
    appendImageToQuestion(orphanQuestion, src);
  };

  for (const block of blocks) {
    if (block.images.length > 0) {
      for (const src of block.images) {
        addOrAttachImage(src);
      }
    }

    if (!block.text) {
      continue;
    }

    const lines = splitTextIntoLines(block.text);
    const blockLooksLikeHeading = isHeadingLine(block.text, block.html);

    for (const line of lines) {
      const questionMatch = line.match(questionPattern);
      const optionMatch = line.match(optionPattern);
      const answerMatch = line.match(answerPattern);
      const yearMatch = line.match(yearPattern);
      const isOption = Boolean(optionMatch);
      const isAnswer = Boolean(answerMatch);
      const isQuestion = Boolean(questionMatch);

      if (isQuestion) {
        const questionNo = `${questionMatch?.[1] ?? ''}${questionMatch?.[2] ?? ''}`.trim();
        const remainder = questionMatch?.[3]?.trim() ?? '';
        currentQuestion = createQuestion(questionNo);

        if (yearMatch && remainder.includes(`[${yearMatch[1]}]`)) {
          currentQuestion.year = yearMatch[1];
        }

        if (answerMatch) {
          currentQuestion.answer = answerMatch[1].trim();
        }

        if (remainder) {
          appendTextToQuestion(currentQuestion, remainder);
        }

        continue;
      }

      if (blockLooksLikeHeading && currentSection.questions.length === 0 && !currentQuestion) {
        currentSection.title = line;
        continue;
      }

      if (isOption) {
        const question = currentQuestion ?? createQuestion('');

        const optionText = optionMatch?.[2]?.trim() ?? '';
        question.options.push(optionText);
        continue;
      }

      if (isAnswer) {
        const question = currentQuestion ?? createQuestion('');

        question.answer = answerMatch?.[1]?.trim();
        continue;
      }

      if (yearMatch) {
        const question = currentQuestion ?? createQuestion('');

        question.year = yearMatch[1];
        const lineWithoutYear = line.replace(yearPattern, '').trim();
        if (lineWithoutYear) {
          appendTextToQuestion(question, lineWithoutYear);
        }
        continue;
      }

      if (blockLooksLikeHeading && line.length <= 120 && line.split(/\s+/).length <= 12) {
        currentSection = {
          title: line,
          questions: [],
        };
        sections.push(currentSection);
        currentQuestion = null;
        continue;
      }

      if (!currentQuestion) {
        currentSection = {
          title: line,
          questions: [],
        };
        sections.push(currentSection);
        currentQuestion = null;
        continue;
      }

      appendTextToQuestion(currentQuestion, line);
    }
  }

  return {
    sections: sections.filter((section) => section.questions.length > 0 || section.title !== DEFAULT_SECTION_TITLE),
  };
}
