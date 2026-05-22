import PptxGenJS from 'pptxgenjs';
import type { Slide, SlideItem } from '../layoutEngine/calculateLayout';
import type { PptSettings } from '../../types/settings';
import fs from 'fs';

function createTextSegments(item: SlideItem, settings: PptSettings) {
  if (item.type === 'sectionTitle') {
    return [
      {
        text: String(item.content.title || ''),
        options: { fontSize: settings.fontSize, color: settings.yearColor },
      },
    ];
  }

  const question = item.content.question;
  const segments: Array<{ text: string; options: { fontSize: number; color: string } }> = [];
  const baseQuestionText = question.questionNo
    ? `${question.questionNo}. ${question.text}`
    : question.text;

  if (baseQuestionText) {
    segments.push({
      text: baseQuestionText,
      options: { fontSize: settings.fontSize, color: settings.questionOptionColor },
    });
  }

  if (question.year) {
    segments.push({
      text: ` ${question.year}`,
      options: { fontSize: settings.fontSize, color: settings.yearColor },
    });
  }

  if (Array.isArray(question.options) && question.options.length > 0) {
    question.options.forEach((option: string) => {
      segments.push({
        text: `\n${option}`,
        options: { fontSize: settings.fontSize, color: settings.questionOptionColor },
      });
    });
  }

  if (settings.showAnswer && question.answer) {
    segments.push({
      text: `\nउत्तर: ${question.answer}`,
      options: { fontSize: settings.fontSize, color: settings.questionOptionColor },
    });
  }

  return segments;
}

function renderQuestionItem(slide: any, item: SlideItem, settings: PptSettings) {
  const segments = createTextSegments(item, settings);

  try {
    slide.addText(segments, {
      x: item.x,
      y: item.y,
      w: item.width,
      h: item.height,
      fontSize: settings.fontSize,
      align: 'left',
      valign: 'top',
      lineSpacing: 1.2,
      wrap: true,
    });
  } catch (err) {
    console.error("addText error (question):", err);
  }
}

export async function generatePpt(
  slides: Slide[],
  settings: PptSettings,
  outputFilePath: string,
): Promise<string> {
  const pptx = new PptxGenJS();

  console.log("Slides:", slides.length);
  console.log("Font:", settings.fontSize);

  slides.forEach((slideDef, index) => {
    const slide = pptx.addSlide();
    console.log(`Slide ${index + 1} items:`, slideDef.items.length);

    if (settings.backgroundImage) {
      const bgPath = settings.backgroundImage;
      console.log(`  Background path: ${bgPath}`);
      console.log(`  Background exists: ${fs.existsSync(bgPath)}`);
      if (typeof bgPath === 'string' && fs.existsSync(bgPath)) {
        try {
          slide.addImage({
            path: bgPath,
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5,
          });
        } catch (err) {
          console.error(`  Background addImage error (slide ${index + 1}):`, err);
        }
      } else {
        console.warn(`  Background image not found, skipping: ${bgPath}`);
      }
    } else {
      console.log("  No background image configured");
    }

    slideDef.items.forEach((item) => {
      if (item.type === 'question') {
        renderQuestionItem(slide, item, settings);
        return;
      }

      if (item.type === 'sectionTitle') {
        try {
          slide.addText([{ text: String(item.content.title || ''), options: { fontSize: settings.fontSize, color: settings.yearColor } }], {
            x: item.x,
            y: item.y,
            w: item.width,
            h: item.height,
            align: 'left',
            valign: 'top',
            wrap: true,
          });
        } catch (err) {
          console.error("addText error (sectionTitle):", err);
        }
      }
    });
  });

  try {
    await pptx.writeFile({ fileName: outputFilePath });
  } catch (err) {
    console.error("writeFile error:", err);
    throw err;
  }
  return outputFilePath;
}
