import PptxGenJS from 'pptxgenjs';
import type { Slide, SlideItem } from '../layoutEngine/calculateLayout';
import type { PptSettings } from '../../types/settings';
import fs from 'fs';

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

function mixWithWhite(color: string, whiteRatio = 0.84): string {
  const hex = color.replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return 'D1FAE5';
  }

  const mixedChannels = [0, 2, 4].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16);
    return Math.round(channel * (1 - whiteRatio) + 255 * whiteRatio);
  });

  return mixedChannels.map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase();
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

function createTextSegments(item: SlideItem, settings: PptSettings) {
  if (item.type === 'sectionTitle') {
    const sectionColor = isDarkColor(settings.headingColor)
      ? settings.questionNoOptionNoColor
      : settings.headingColor;

    return [
      {
        text: String(item.content?.title || ''),
        options: { fontSize: settings.headingFontSize, color: sectionColor, bold: true },
      },
    ];
  }

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

  let highlightedAnswer = false;
  if (Array.isArray(question?.options)) {
    question.options.forEach((option: string, idx: number) => {
      const bullet = getBulletPrefix(settings.bulletStyle, idx, settings.showBulletPoints);
      const optionParts = splitOption(option);
      const isAnswerOption = settings.showAnswer && isCorrectOption(option, idx, question?.answer);
      const highlight = isAnswerOption ? mixWithWhite(settings.answerColor) : undefined;
      highlightedAnswer = highlightedAnswer || isAnswerOption;

      segments.push({
        text: '\n',
        options: { fontSize: settings.fontSize },
      });

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
            ...(highlight ? { highlight } : {}),
          },
        });
      }

      segments.push({
        text: optionParts.body,
        options: {
          fontSize: settings.fontSize,
          color: isAnswerOption ? settings.answerColor : settings.questionOptionColor,
          ...(isAnswerOption ? { bold: true, highlight } : {}),
        },
      });

      if (isAnswerOption) {
        segments.push({
          text: `  ${ANSWER_LABEL}`,
          options: { fontSize: settings.fontSize * 0.8, color: settings.answerColor, bold: true },
        });
      }
    });
  }

  if (settings.showAnswer && question?.answer && !highlightedAnswer) {
    segments.push({
      text: '\n',
      options: { fontSize: settings.fontSize },
    });
    segments.push({
      text: `${ANSWER_LABEL}: ${question.answer}`,
      options: { fontSize: settings.fontSize, color: settings.answerColor, bold: true },
    });
  }

  return segments;
}

function renderQuestionImages(slide: any, item: SlideItem, textHeight: number) {
  const images = item.content?.question?.images;
  if (!Array.isArray(images) || images.length === 0) {
    return;
  }

  const imageTop = item.y + textHeight + 0.1;
  const availableHeight = Math.max(0.8, item.height - textHeight - 0.1);
  const imageHeight = Math.min(1.45, availableHeight / images.length);
  const imageWidth = Math.min(item.width, 4.8);

  images.forEach((image: string, index: number) => {
    slide.addImage({
      data: image,
      x: item.x,
      y: imageTop + index * imageHeight,
      w: imageWidth,
      h: imageHeight,
      sizing: { type: 'contain', w: imageWidth, h: imageHeight },
    });
  });
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
  const segments = createTextSegments(item, renderSettings);
  const images = item.content?.question?.images;
  const hasImages = Array.isArray(images) && images.length > 0;
  const textHeight = hasImages ? Math.max(0.8, item.height - images.length * 1.55) : item.height;

  slide.addText(segments, {
    x: item.x,
    y: item.y,
    w: item.width,
    h: textHeight,
    align: 'left' as const,
    valign: 'top' as const,
    lineSpacing: renderSettings.lineSpacing * renderSettings.fontSize,
    wrap: true,
    fit: 'shrink',
  });

  renderQuestionImages(slide, item, textHeight);
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
        const segments = createTextSegments(item, settings);
        slide.addText(segments, {
          x: item.x,
          y: item.y,
          w: item.width,
          h: item.height,
          align: 'left' as const,
          valign: 'top' as const,
          lineSpacing: settings.lineSpacing * settings.headingFontSize,
          wrap: true,
          fit: 'shrink',
        });
      }
    });
  });

  await pptx.writeFile({ fileName: outputFilePath });
  return outputFilePath;
}
