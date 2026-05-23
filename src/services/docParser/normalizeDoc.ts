import type { ParsedDocument } from './parseDoc';

export interface NormalizedQuestion {
  id: number;
  questionNo: string;
  text: string;
  options: string[];
  year: string | null;
  answer: string | null;
  images: string[];
}

export interface NormalizedSection {
  title: string;
  questions: NormalizedQuestion[];
}

export interface NormalizedDocument {
  sections: NormalizedSection[];
}

function normalizeText(text: string): string {
  const trimmed = text.trim();
  const withoutExtraSpaces = trimmed.replace(/[ \t]+/g, ' ');
  const withoutDuplicateLineBreaks = withoutExtraSpaces.replace(/\n{2,}/g, '\n');
  return withoutDuplicateLineBreaks
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

function normalizeOptions(options: string[] | undefined): string[] {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => normalizeText(option))
    .filter((option) => option.length > 0);
}

function normalizeQuestionNo(questionNo: unknown): string {
  if (typeof questionNo !== 'string') {
    return '';
  }

  return normalizeText(questionNo).replace(/[.)]+$/g, '');
}

function normalizeImages(images: string[] | undefined): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map((image) => image.trim()).filter((image) => image.length > 0);
}

function normalizeQuestion(question: any): NormalizedQuestion {
  return {
    id: typeof question.id === 'number' ? question.id : 0,
    questionNo: normalizeQuestionNo(question.questionNo),
    text: typeof question.text === 'string' ? normalizeText(question.text) : '',
    options: normalizeOptions(question.options),
    year: typeof question.year === 'string' && question.year.trim().length > 0 ? question.year.trim() : null,
    answer: typeof question.answer === 'string' && question.answer.trim().length > 0 ? normalizeText(question.answer) : null,
    images: normalizeImages(question.images),
  };
}

function normalizeSection(section: any): NormalizedSection {
  const title = typeof section.title === 'string' ? normalizeText(section.title) : '';
  const questions = Array.isArray(section.questions)
    ? section.questions.map(normalizeQuestion)
    : [];

  return {
    title,
    questions,
  };
}

export function normalizeDoc(parsedDoc: ParsedDocument): NormalizedDocument {
  const sections = Array.isArray(parsedDoc.sections)
    ? parsedDoc.sections.map(normalizeSection)
    : [];

  return {
    sections,
  };
}
