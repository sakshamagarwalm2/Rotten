import type {
  NormalizedDocument,
  NormalizedQuestion,
  NormalizedSection,
} from '../docParser/normalizeDoc';
import type { TableData } from '../docParser/parseDoc';
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

const AVERAGE_CHAR_WIDTH_RATIO = 0.55;
const POINTS_PER_INCH = 72;
const YEAR_TAG_WIDTH = 1.2;

function clampLineWidth(width: number, fontSize: number): number {
  const widthInPoints = width * POINTS_PER_INCH;
  return Math.max(fontSize * 8, widthInPoints);
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

function calculateTextHeight(text: string, width: number, fontSize: number, lineSpacing: number): number {
  const lineCount = calculateLineCount(text, width, fontSize);
  return (lineCount * fontSize * lineSpacing) / POINTS_PER_INCH;
}

function calculateOptionHeights(options: string[], width: number, fontSize: number, lineSpacing: number): {
  totalHeight: number;
  optionHeights: number[];
} {
  const optionHeights = options.map((option) => calculateTextHeight(option, width, fontSize, lineSpacing));
  const totalHeight = optionHeights.reduce((sum, height) => sum + height, 0);
  return { totalHeight, optionHeights };
}

function calculateAnswerHeight(answer: string | null, width: number, fontSize: number, lineSpacing: number): number {
  if (!answer) {
    return 0;
  }

  return calculateTextHeight(answer, width, fontSize, lineSpacing);
}

function calculateImagesHeight(images: string[], contentWidth: number): number {
  if (images.length === 0) return 0;
  const maxImgWidth = Math.min(contentWidth, 6);
  const imgHeight = maxImgWidth / 1.5;
  return images.length * imgHeight + (images.length - 1) * 0.1;
}

const TABLE_ROW_HEIGHT = 0.4;

function calculateTablesHeight(tables: TableData[] | undefined, contentWidth: number): number {
  if (!tables || tables.length === 0) return 0;
  let total = 0;
  for (const table of tables) {
    total += table.rows.length * TABLE_ROW_HEIGHT + 0.1;
  }
  return total;
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
    tables: Array.isArray(question?.tables) ? question.tables : [],
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
    currentY += item.height + 0.04;
  };

  const renderSectionTitle = (title: string) => {
    if (!title) {
      return;
    }

    if (currentItems.length > 0) {
      flushSlide();
    }

    addItem({
      type: 'sectionTitle',
      content: { title },
      x: settings.contentArea.left,
      y: contentTop,
      width: settings.contentArea.width,
      height: settings.contentArea.height,
    });

    flushSlide();
  };

  const renderQuestion = (question: NormalizedQuestion) => {
    const questionText = question.questionNo
      ? `${question.questionNo}. ${question.text}`
      : question.text;

    const yearTagWidth = question.year ? YEAR_TAG_WIDTH : 0;
    const questionTextWidth = Math.max(1, settings.contentArea.width - yearTagWidth);
    const questionTextHeight = calculateTextHeight(questionText, questionTextWidth, settings.headingFontSize, settings.lineSpacing);
    const optionsData = calculateOptionHeights(question.options, settings.contentArea.width, settings.fontSize, settings.lineSpacing);
    const answerHeight = settings.showAnswer ? calculateAnswerHeight(question.answer, settings.contentArea.width, settings.fontSize, settings.lineSpacing) : 0;
    const imagesHeight = calculateImagesHeight(question.images, settings.contentArea.width);
    const tablesHeight = calculateTablesHeight(question.tables, settings.contentArea.width);
    const questionBlockHeight = questionTextHeight + optionsData.totalHeight + answerHeight + imagesHeight + tablesHeight;
    const itemHeight = Math.min(questionBlockHeight, settings.contentArea.height);

    if (currentItems.length > 0) {
      flushSlide();
    }
    addItem({
      type: 'question',
      content: {
        question,
        metrics: {
          textHeight: questionTextHeight,
          optionHeights: optionsData.optionHeights,
          answerHeight,
          imagesHeight,
          tablesHeight,
          questionBlockHeight,
        },
      },
      x: settings.contentArea.left,
      y: currentY,
      width: settings.contentArea.width,
      height: itemHeight,
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
