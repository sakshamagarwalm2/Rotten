import PptxGenJS from 'pptxgenjs';
import type { Slide, SlideItem } from '../layoutEngine/calculateLayout';
import type { PptSettings } from '../../types/settings';
import fs from 'fs';

function getBulletPrefix(bulletStyle: string, index: number, showBulletPoints: boolean): string {
  if (!showBulletPoints || bulletStyle === 'none') return '';
  
  switch (bulletStyle) {
    case 'disc': return '● ';
    case 'circle': return '○ ';
    case 'square': return '■ ';
    case 'number': return `${index + 1}. `;
    case 'letters': return `${String.fromCharCode(65 + index)}. `;
    default: return '';
  }
}

function createTextSegments(item: SlideItem, settings: PptSettings) {
  if (item.type === 'sectionTitle') {
    return [
      {
        text: String(item.content?.title || ''),
        options: { fontSize: settings.headingFontSize, color: settings.yearColor },
      },
    ];
  }

  const question = item.content?.question;
  const segments: any[] = [];

  // Question Number and Text
  if (question?.questionNo) {
    segments.push({
      text: `प्रश्न ${question.questionNo}. `,
      options: { fontSize: settings.headingFontSize, color: settings.questionNoOptionNoColor, bold: true },
    });
  }

  if (question?.text) {
    segments.push({
      text: question.text,
      options: { fontSize: settings.headingFontSize, color: settings.questionOptionColor, bold: true },
    });
  }

  // Year Tag (inline like preview)
  if (question?.year) {
    segments.push({
      text: `  ${question.year}`,
      options: { fontSize: settings.headingFontSize * 0.7, color: settings.yearColor, bold: true },
    });
  }

  // Options
  if (Array.isArray(question?.options)) {
    question.options.forEach((option: string, idx: number) => {
      const bullet = getBulletPrefix(settings.bulletStyle, idx, settings.showBulletPoints);
      
      segments.push({
        text: `\n`, // New line for each option
        options: { fontSize: settings.fontSize },
      });

      if (bullet) {
        segments.push({
          text: bullet,
          options: { fontSize: settings.fontSize, color: settings.questionNoOptionNoColor, bold: true },
        });
      }

      segments.push({
        text: option,
        options: { fontSize: settings.fontSize, color: settings.questionOptionColor },
      });
    });
  }

  // Answer
  if (settings.showAnswer && question?.answer) {
    segments.push({
      text: `\n`,
      options: { fontSize: settings.fontSize },
    });
    segments.push({
      text: `उत्तर: ${question.answer}`,
      options: { fontSize: settings.fontSize, color: settings.answerColor, bold: true },
    });
  }

  return segments;
}

function renderQuestionItem(slide: any, item: SlideItem, settings: PptSettings) {
  const segments = createTextSegments(item, settings);

  const textOptions = {
    x: item.x,
    y: item.y,
    w: item.width,
    h: item.height,
    align: 'left' as const,
    valign: 'top' as const,
    lineSpacing: settings.lineSpacing * settings.fontSize, // Line spacing in points
    wrap: true,
  };

  slide.addText(segments, textOptions);
}

export async function generatePpt(
  slides: Slide[],
  settings: PptSettings,
  outputFilePath: string,
): Promise<string> {
  const pptx = new PptxGenJS();

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
        });
      }
    });
  });

  await pptx.writeFile({ fileName: outputFilePath });
  return outputFilePath;
}
