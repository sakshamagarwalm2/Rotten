import PptxGenJS from 'pptxgenjs';
import type { Slide, SlideItem } from '../layoutEngine/calculateLayout';
import type { PptSettings } from '../../types/settings';
import type { TableData } from '../docParser/parseDoc';
import fs from 'fs';
import sizeOf from 'image-size';
import { logger } from '../../utils/logger';

const QUESTION_LABEL = '\u092a\u094d\u0930\u0936\u094d\u0928';
const ANSWER_LABEL = '\u0909\u0924\u094d\u0924\u0930';

function getBulletPrefix(bulletStyle: string, index: number, showBulletPoints: boolean): string {
  if (!showBulletPoints || bulletStyle === 'none') return '';

  switch (bulletStyle) {
    case 'disc': return '\u25cf ';
    case 'circle': return '\u25cb ';
    case 'square': return '\u25a0 ';
    case 'number': return `${index + 1}. `;
    case 'letters': return `${String.fromCharCode(65 + index)}. `;
    default: return '';
  }
}

function isDarkColor(color: string): boolean {
  const hex = color.replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return false;
  }

  const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance < 0.25;
}

function normalizeAnswerKey(answer: string | null | undefined): string {
  return String(answer ?? '')
    .trim()
    .toLowerCase()
    .replace(/^answer\s*[:\-]?\s*/i, '')
    .replace(/^[\s([]+/, '')
    .replace(/[\s)\].]+$/, '');
}

function splitOption(option: string): { label: string | null; body: string } {
  const match = option.match(/^\s*\(([a-d])\)\s*(.*)$/);
  if (!match) {
    return { label: null, body: option };
  }

  return {
    label: match[1].toLowerCase(),
    body: match[2] ?? '',
  };
}

function isCorrectOption(option: string, index: number, answer: string | null | undefined): boolean {
  const answerKey = normalizeAnswerKey(answer);
  if (!answerKey) {
    return false;
  }

  const optionKey = splitOption(option).label;
  if (optionKey && optionKey === answerKey) {
    return true;
  }

  if (/^[1-4]$/.test(answerKey)) {
    return Number(answerKey) === index + 1;
  }

  return false;
}

function createHeadingSegments(item: SlideItem, settings: PptSettings) {
  const question = item.content?.question;
  const segments: any[] = [];

  if (question?.questionNo) {
    segments.push({
      text: `${QUESTION_LABEL} ${question.questionNo}. `,
      options: { fontSize: settings.headingFontSize, color: settings.questionNoOptionNoColor, bold: true },
    });
  }

  if (question?.text) {
    segments.push({
      text: question.text,
      options: { fontSize: settings.headingFontSize, color: settings.questionOptionColor, bold: true },
    });
  }

  if (question?.year) {
    segments.push({
      text: `  [${question.year}]`,
      options: { fontSize: settings.headingFontSize * 0.7, color: settings.yearColor, bold: true },
    });
  }

  return segments;
}

function createOptionSegments(item: SlideItem, settings: PptSettings): { segments: any[]; highlightedAnswer: boolean } {
  const question = item.content?.question;
  const segments: any[] = [];
  let highlightedAnswer = false;

  if (Array.isArray(question?.options)) {
    question.options.forEach((option: string, idx: number) => {
      const bullet = getBulletPrefix(settings.bulletStyle, idx, settings.showBulletPoints);
      const optionParts = splitOption(option);
      const isAnswerOption = settings.showAnswer && isCorrectOption(option, idx, question?.answer);
      highlightedAnswer = highlightedAnswer || isAnswerOption;

      if (idx > 0) {
        segments.push({ text: '\n', options: { fontSize: settings.fontSize } });
      }

      if (bullet) {
        segments.push({
          text: bullet,
          options: {
            fontSize: settings.fontSize,
            color: isAnswerOption ? settings.answerColor : settings.questionNoOptionNoColor,
            bold: true,
          },
        });
      }

      if (optionParts.label) {
        segments.push({
          text: `(${optionParts.label}) `,
          options: {
            fontSize: settings.fontSize,
            color: isAnswerOption ? settings.answerColor : settings.questionNoOptionNoColor,
            bold: true,
          },
        });
      }

      segments.push({
        text: optionParts.body,
        options: {
          fontSize: settings.fontSize,
          color: isAnswerOption ? settings.answerColor : settings.questionOptionColor,
          ...(isAnswerOption ? { bold: true } : {}),
        },
      });

      if (isAnswerOption) {
        segments.push({
          text: `  ${ANSWER_LABEL}`,
          options: { fontSize: settings.fontSize, color: settings.answerColor, bold: true },
        });
      }
    });
  }

  return { segments, highlightedAnswer };
}

const imageDimCache = new Map<string, { width: number; height: number }>();

function getImageDimensions(base64DataUri: string): { width: number; height: number } | null {
  const cached = imageDimCache.get(base64DataUri);
  if (cached) return cached;

  try {
    const commaIdx = base64DataUri.indexOf(',');
    const base64 = commaIdx >= 0 ? base64DataUri.slice(commaIdx + 1) : base64DataUri;
    const buffer = Buffer.from(base64, 'base64');
    const dims = sizeOf(buffer);
    if (dims.width && dims.height) {
      imageDimCache.set(base64DataUri, { width: dims.width, height: dims.height });
      return { width: dims.width, height: dims.height };
    }
  } catch {
    // fallback: return null
  }
  return null;
}

function calculateImageDisplaySize(
  dataUri: string,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const dims = getImageDimensions(dataUri);
  if (!dims) {
    return { width: maxWidth, height: Math.min(maxHeight, 1.5) };
  }

  const aspect = dims.width / dims.height;
  let w = Math.min(dims.width / 96, maxWidth);
  let h = w / aspect;

  if (h > maxHeight) {
    h = maxHeight;
    w = h * aspect;
  }

  return { width: Math.round(w * 100) / 100, height: Math.round(h * 100) / 100 };
}

const TABLE_ROW_HEIGHT = 0.4;
const TABLE_BORDER = { type: 'solid' as const, pt: 1, color: '000000' };

function renderTable(slide: any, table: TableData, x: number, y: number, w: number, maxH: number): number {
  const cols = table.rows.reduce((max, row) => Math.max(max, row.cells.length), 0);
  if (cols === 0) return 0;

  const colW = w / cols;
  const rowH = Math.min(TABLE_ROW_HEIGHT, maxH / table.rows.length);

  const pptRows: any[][] = [];
  for (const row of table.rows) {
    const pptRow: any[] = [];
    for (const cell of row.cells) {
      pptRow.push({
        text: cell.text,
        options: {
          fontSize: 11,
          color: '333333',
          align: 'center' as const,
          valign: 'middle' as const,
          border: TABLE_BORDER,
          ...(cell.colspan && cell.colspan > 1 ? { colspan: cell.colspan } : {}),
          ...(cell.rowspan && cell.rowspan > 1 ? { rowspan: cell.rowspan } : {}),
        },
      });
    }
    pptRows.push(pptRow);
  }

  slide.addTable(pptRows, {
    x,
    y,
    w,
    h: table.rows.length * rowH,
    colW: Array(cols).fill(colW),
    rowH: Array(table.rows.length).fill(rowH),
    border: TABLE_BORDER,
    autoPage: false,
  });

  return table.rows.length * rowH + 0.1;
}

function renderQuestionItem(slide: any, item: SlideItem, settings: PptSettings) {
  const rawHeight = item.content?.metrics?.questionBlockHeight;
  const scale = typeof rawHeight === 'number' && rawHeight > item.height
    ? Math.max(0.62, item.height / rawHeight)
    : 1;
  const renderSettings = scale < 1
    ? {
        ...settings,
        fontSize: Math.max(12, Math.floor(settings.fontSize * scale)),
        headingFontSize: Math.max(16, Math.floor(settings.headingFontSize * scale)),
      }
    : settings;

  const images = item.content?.question?.images;
  const hasImages = Array.isArray(images) && images.length > 0;

  const metrics = item.content?.metrics;
  const textHeight = metrics?.textHeight ?? item.height * 0.3;
  const optionTotalHeight = metrics?.optionHeights?.reduce((s: number, h: number) => s + h, 0) ?? item.height * 0.5;
  const answerH = metrics?.answerHeight ?? 0;

  let currentY = item.y;

  // Question heading (fontSize: headingFontSize)
  const headingSegments = createHeadingSegments(item, renderSettings);
  if (headingSegments.length > 0) {
    slide.addText(headingSegments, {
      x: item.x,
      y: currentY,
      w: item.width,
      h: textHeight,
      align: 'left' as const,
      valign: 'top' as const,
      lineSpacing: renderSettings.lineSpacing * renderSettings.headingFontSize,
      wrap: true,
      fit: 'shrink',
    });
    currentY += textHeight + 0.05;
  }

  // Options (fontSize: fontSize)
  const { segments: optionSegments } = createOptionSegments(item, renderSettings);
  if (optionSegments.length > 0) {
    slide.addText(optionSegments, {
      x: item.x,
      y: currentY,
      w: item.width,
      h: optionTotalHeight,
      align: 'left' as const,
      valign: 'top' as const,
      lineSpacing: renderSettings.lineSpacing * renderSettings.fontSize,
      wrap: true,
      fit: 'shrink',
    });
    currentY += optionTotalHeight + 0.05;
  }

  // Images
  if (hasImages) {
    const imgTop = currentY;
    const availableHeight = Math.max(0.8, item.y + item.height - imgTop);

    images.forEach((image: string, index: number) => {
      const display = calculateImageDisplaySize(image, item.width, availableHeight / images.length);
      const yPos = imgTop + index * (display.height + 0.1);
      slide.addImage({
        data: image,
        x: item.x,
        y: yPos,
        w: display.width,
        h: display.height,
      });
    });
    const totalImgH = images.reduce((sum, img, i) => {
      const d = calculateImageDisplaySize(img, item.width, availableHeight / images.length);
      return sum + d.height + (i > 0 ? 0.1 : 0);
    }, 0);
    currentY += totalImgH + 0.05;
  }

  // Tables
  const tables = item.content?.question?.tables;
  if (Array.isArray(tables) && tables.length > 0) {
    const availableH = Math.max(0.4, item.y + item.height - currentY);
    for (const table of tables) {
      if (table.rows.length === 0) continue;
      const used = renderTable(slide, table, item.x, currentY, item.width, availableH);
      currentY += used;
    }
  }

  // Answer (fontSize: fontSize)
  if (renderSettings.showAnswer && item.content?.question?.answer) {
    const { highlightedAnswer } = createOptionSegments(item, renderSettings);
    if (!highlightedAnswer) {
      slide.addText([
        {
          text: `${ANSWER_LABEL}: ${item.content.question.answer}`,
          options: { fontSize: renderSettings.fontSize, color: renderSettings.answerColor, bold: true },
        },
      ], {
        x: item.x,
        y: currentY,
        w: item.width,
        h: answerH || 0.4,
        align: 'left' as const,
        valign: 'top' as const,
        lineSpacing: renderSettings.lineSpacing * renderSettings.fontSize,
        wrap: true,
        fit: 'shrink',
      });
    }
  }
}

export async function generatePpt(
  slides: Slide[],
  settings: PptSettings,
  outputFilePath: string,
): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  slides.forEach((slideDef) => {
    const slide = pptx.addSlide();

    if (settings.backgroundImage && typeof settings.backgroundImage === 'string') {
      const bgPath = settings.backgroundImage;
      if (fs.existsSync(bgPath)) {
        slide.addImage({
          path: bgPath,
          x: 0,
          y: 0,
          w: 13.33,
          h: 7.5,
          sizing: { type: 'cover', w: 13.33, h: 7.5 },
        });
      }
    }

    slideDef.items.forEach((item) => {
      if (item.type === 'question') {
        renderQuestionItem(slide, item, settings);
        return;
      }

      if (item.type === 'sectionTitle') {
        const sectionColor = isDarkColor(settings.headingColor)
          ? settings.questionNoOptionNoColor
          : settings.headingColor;
        const titleFontSize = Math.max(settings.headingFontSize * 1.5, 44);
        const segments = [
          {
            text: String(item.content?.title || ''),
            options: { fontSize: titleFontSize, color: sectionColor, bold: true },
          },
        ];
        slide.addText(segments, {
          x: item.x,
          y: item.y,
          w: item.width,
          h: item.height,
          align: 'center' as const,
          valign: 'middle' as const,
          wrap: true,
          fit: 'shrink',
        });
      }
    });
  });

  await pptx.writeFile({ fileName: outputFilePath });
  return outputFilePath;
}
