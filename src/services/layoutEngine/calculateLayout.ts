import type {
  NormalizedDocument,
  NormalizedQuestion,
  NormalizedSection,
} from '../docParser/normalizeDoc';
import type { PptSettings } from '../../types/settings';

export interface SlideItem {
  type: string;
  content: any;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Slide {
  id: number;
  items: SlideItem[];
}

const LINE_HEIGHT_MULTIPLIER = 1.2;
const AVERAGE_CHAR_WIDTH_RATIO = 0.55;
const IMAGE_PLACEHOLDER_HEIGHT_RATIO = 5;

function clampLineWidth(width: number, fontSize: number): number {
  return Math.max(fontSize * 10, width);
}

function calculateLineCount(text: string, width: number, fontSize: number): number {
  if (!text) {
    return 0;
  }

  const effectiveWidth = clampLineWidth(width, fontSize);
  const charsPerLine = Math.max(1, Math.floor(effectiveWidth / (fontSize * AVERAGE_CHAR_WIDTH_RATIO)));

  return text
    .split(/\r?\n/)
    .map((line) => {
      const length = line.trim().length;
      return length === 0 ? 0 : Math.max(1, Math.ceil(length / charsPerLine));
    })
    .reduce((sum, count) => sum + count, 0);
}

function calculateTextHeight(text: string, width: number, fontSize: number): number {
  const lineCount = calculateLineCount(text, width, fontSize);
  return lineCount * fontSize * LINE_HEIGHT_MULTIPLIER;
}

function calculateOptionHeights(options: string[], width: number, fontSize: number): {
  totalHeight: number;
  optionHeights: number[];
} {
  const optionHeights = options.map((option) => calculateTextHeight(option, width, fontSize));
  const totalHeight = optionHeights.reduce((sum, height) => sum + height, 0);
  return { totalHeight, optionHeights };
}

function calculateAnswerHeight(answer: string | null, width: number, fontSize: number): number {
  if (!answer) {
    return 0;
  }

  return calculateTextHeight(answer, width, fontSize);
}

function calculateImagesHeight(images: string[], fontSize: number): number {
  return images.length * fontSize * IMAGE_PLACEHOLDER_HEIGHT_RATIO;
}

function normalizeQuestionInput(question: NormalizedQuestion | null | undefined): NormalizedQuestion {
  return {
    id: question?.id ?? 0,
    questionNo: question?.questionNo ?? '',
    text: question?.text ?? '',
    options: Array.isArray(question?.options) ? question.options : [],
    year: question?.year ?? null,
    answer: question?.answer ?? null,
    images: Array.isArray(question?.images) ? question.images : [],
  };
}

function normalizeSectionInput(section: NormalizedSection | null | undefined): NormalizedSection {
  return {
    title: section?.title ?? '',
    questions: Array.isArray(section?.questions) ? section.questions : [],
  };
}

export function calculateLayout(
  document: NormalizedDocument,
  settings: PptSettings,
): Slide[] {
  const slides: Slide[] = [];
  const contentTop = settings.contentArea.top;
  const contentBottom = settings.contentArea.top + settings.contentArea.height;
  let currentSlideId = 1;
  let currentY = contentTop;
  let currentItems: SlideItem[] = [];

  const flushSlide = () => {
    slides.push({ id: currentSlideId, items: currentItems });
    currentSlideId += 1;
    currentItems = [];
    currentY = contentTop;
  };

  const startNewSlideIfNeeded = (itemHeight: number) => {
    if (currentItems.length > 0 && currentY + itemHeight > contentBottom) {
      flushSlide();
    }
  };

  const addItem = (item: SlideItem) => {
    currentItems.push(item);
    currentY += item.height + 20; // Fixed gap since setting was removed
  };

  const renderSectionTitle = (title: string) => {
    if (!title) {
      return;
    }

    const titleHeight = calculateTextHeight(title, settings.contentArea.width, settings.fontSize);
    startNewSlideIfNeeded(titleHeight);
    addItem({
      type: 'sectionTitle',
      content: { title },
      x: settings.contentArea.left,
      y: currentY,
      width: settings.contentArea.width,
      height: titleHeight,
    });
  };

  const renderQuestion = (question: NormalizedQuestion) => {
    const questionText = question.questionNo
      ? `${question.questionNo}. ${question.text}`
      : question.text;

    const questionTextHeight = calculateTextHeight(questionText, settings.contentArea.width, settings.fontSize);
    const optionsData = calculateOptionHeights(question.options, settings.contentArea.width, settings.fontSize);
    const answerHeight = settings.showAnswer ? calculateAnswerHeight(question.answer, settings.contentArea.width, settings.fontSize) : 0;
    const imagesHeight = calculateImagesHeight(question.images, settings.fontSize);
    const questionBlockHeight = questionTextHeight + optionsData.totalHeight + answerHeight + imagesHeight;

    startNewSlideIfNeeded(questionBlockHeight);
    addItem({
      type: 'question',
      content: {
        question,
        metrics: {
          textHeight: questionTextHeight,
          optionHeights: optionsData.optionHeights,
          answerHeight,
          imagesHeight,
          questionBlockHeight,
        },
      },
      x: settings.contentArea.left,
      y: currentY,
      width: settings.contentArea.width,
      height: questionBlockHeight,
    });
  };

  const documentSections = Array.isArray(document.sections) ? document.sections : [];
  for (const sectionInput of documentSections) {
    const section = normalizeSectionInput(sectionInput);
    renderSectionTitle(section.title);

    for (const questionInput of section.questions) {
      const question = normalizeQuestionInput(questionInput);
      renderQuestion(question);
    }
  }

  if (currentItems.length > 0) {
    flushSlide();
  }

  return slides;
}
