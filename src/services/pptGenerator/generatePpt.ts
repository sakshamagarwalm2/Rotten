import PptxGenJS from 'pptxgenjs';
import type { Slide, SlideItem } from '../layoutEngine/calculateLayout';
import type { PptSettings } from '../../types/settings';
import fs from 'fs';

function createTextSegments(item: SlideItem, settings: PptSettings) {
  console.log("[createTextSegments] ENTER - item.type:", item.type);
  console.log("[createTextSegments] item.content keys:", Object.keys(item.content));
  console.log("[createTextSegments] item.content (JSON):", JSON.stringify(item.content, null, 2));

  if (item.type === 'sectionTitle') {
    const titleRaw = item.content?.title;
    console.log("[createTextSegments] sectionTitle - raw title value:", titleRaw);
    console.log("[createTextSegments] sectionTitle - title type:", typeof titleRaw);
    const result = [
      {
        text: String(titleRaw || ''),
        options: { fontSize: settings.fontSize, color: settings.yearColor },
      },
    ];
    console.log("[createTextSegments] sectionTitle - returning segments:", JSON.stringify(result, null, 2));
    return result;
  }

  const question = item.content?.question;
  console.log("[createTextSegments] question item - question object:", JSON.stringify(question, null, 2));
  console.log("[createTextSegments] question item - question type:", typeof question);
  console.log("[createTextSegments] question item - question keys:", question ? Object.keys(question) : "null/undefined");

  const segments: Array<{ text: string; options: { fontSize: number; color: string } }> = [];
  const baseQuestionText = question?.questionNo
    ? `${question.questionNo}. ${question.text}`
    : question?.text;

  console.log("[createTextSegments] baseQuestionText:", baseQuestionText);
  console.log("[createTextSegments] question.questionNo:", question?.questionNo);
  console.log("[createTextSegments] question.text:", question?.text);
  console.log("[createTextSegments] question.year:", question?.year);
  console.log("[createTextSegments] question.options (isArray):", Array.isArray(question?.options));
  console.log("[createTextSegments] question.options (length):", question?.options?.length);
  console.log("[createTextSegments] question.answer:", question?.answer);
  console.log("[createTextSegments] settings.showAnswer:", settings.showAnswer);

  if (baseQuestionText) {
    console.log("[createTextSegments] pushing baseQuestionText segment");
    segments.push({
      text: baseQuestionText,
      options: { fontSize: settings.fontSize, color: settings.questionOptionColor },
    });
  } else {
    console.log("[createTextSegments] SKIPPING baseQuestionText - falsy");
  }

  if (question?.year) {
    console.log("[createTextSegments] pushing year segment:", question.year);
    segments.push({
      text: ` ${question.year}`,
      options: { fontSize: settings.fontSize, color: settings.yearColor },
    });
  } else {
    console.log("[createTextSegments] SKIPPING year - falsy or missing");
  }

  if (Array.isArray(question?.options) && question.options.length > 0) {
    console.log("[createTextSegments] processing", question.options.length, "options");
    question.options.forEach((option: string, idx: number) => {
      console.log(`[createTextSegments]   option[${idx}]: "${option}"`);
      segments.push({
        text: `\n${option}`,
        options: { fontSize: settings.fontSize, color: settings.questionOptionColor },
      });
    });
  } else {
    console.log("[createTextSegments] SKIPPING options - empty or missing");
  }

  if (settings.showAnswer && question?.answer) {
    console.log("[createTextSegments] pushing answer segment:", question.answer);
    segments.push({
      text: `\nउत्तर: ${question.answer}`,
      options: { fontSize: settings.fontSize, color: settings.questionOptionColor },
    });
  } else {
    console.log("[createTextSegments] SKIPPING answer - showAnswer:", settings.showAnswer, "| answer:", question?.answer);
  }

  console.log("[createTextSegments] RETURN - segments count:", segments.length);
  console.log("[createTextSegments] RETURN - segments:", JSON.stringify(segments, null, 2));
  return segments;
}

function renderQuestionItem(slide: any, item: SlideItem, settings: PptSettings) {
  console.log("[renderQuestionItem] ENTER");
  console.log("[renderQuestionItem] item.type:", item.type);
  console.log("[renderQuestionItem] item.x:", item.x, "item.y:", item.y, "item.w:", item.width, "item.h:", item.height);
  console.log("[renderQuestionItem] slide constructor:", slide?.constructor?.name);

  const segments = createTextSegments(item, settings);
  console.log("[renderQuestionItem] segments count:", segments.length);

  const textOptions = {
    x: item.x,
    y: item.y,
    w: item.width,
    h: item.height,
    fontSize: settings.fontSize,
    align: 'left' as const,
    valign: 'top' as const,
    lineSpacing: 1.2,
    wrap: true,
  };
  console.log("[renderQuestionItem] addText options:", JSON.stringify(textOptions, null, 2));

  try {
    console.log("[renderQuestionItem] CALLING slide.addText()...");
    slide.addText(segments, textOptions);
    console.log("[renderQuestionItem] slide.addText() SUCCEEDED");
  } catch (err: any) {
    console.error("[renderQuestionItem] addText error (question):", err.message);
    console.error("[renderQuestionItem] addText error stack:", err.stack);
    console.error("[renderQuestionItem] addText error full:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
}

export async function generatePpt(
  slides: Slide[],
  settings: PptSettings,
  outputFilePath: string,
): Promise<string> {
  console.log("");
  console.log("========================================");
  console.log("[generatePpt] ENTER");
  console.log("[generatePpt] outputFilePath:", outputFilePath);
  console.log("[generatePpt] outputFilePath type:", typeof outputFilePath);
  console.log("[generatePpt] output dir exists:", fs.existsSync(outputFilePath ? outputFilePath.substring(0, outputFilePath.lastIndexOf('\\')) : ''));
  console.log("[generatePpt] slides:", slides.length);
  console.log("[generatePpt] slides isArray:", Array.isArray(slides));
  if (slides.length > 0) {
    console.log("[generatePpt] first slide id:", slides[0].id);
    console.log("[generatePpt] first slide items count:", slides[0].items.length);
    console.log("[generatePpt] first slide items:", JSON.stringify(slides[0].items, null, 2));
  }

  console.log("[generatePpt] settings keys:", Object.keys(settings));
  console.log("[generatePpt] settings.fontSize:", settings.fontSize);
  console.log("[generatePpt] settings.questionGap:", (settings as any).questionGap);
  console.log("[generatePpt] settings.showAnswer:", settings.showAnswer);
  console.log("[generatePpt] settings.questionOptionColor:", settings.questionOptionColor);
  console.log("[generatePpt] settings.yearColor:", settings.yearColor);
  console.log("[generatePpt] settings.contentArea:", JSON.stringify(settings.contentArea));
  console.log("[generatePpt] settings.backgroundImage:", settings.backgroundImage);
  console.log("[generatePpt] settings.backgroundImage type:", typeof settings.backgroundImage);
  console.log("[generatePpt] settings.backgroundImage constructor:", (settings.backgroundImage as any)?.constructor?.name);

  if (settings.backgroundImage && typeof settings.backgroundImage !== 'string') {
    console.error("[generatePpt] *** WARNING: backgroundImage is NOT a string! It is:", typeof settings.backgroundImage);
    console.error("[generatePpt] *** WARNING: backgroundImage value:", settings.backgroundImage);
    console.error("[generatePpt] *** This might be a browser File object being passed to Node.js!");
  }

  const pptx = new PptxGenJS();
  console.log("[generatePpt] PptxGenJS instance created:", pptx?.constructor?.name);

  console.log("[generatePpt] Slides array length:", slides.length);

  slides.forEach((slideDef, index) => {
    console.log("");
    console.log("----------------------------------------");
    console.log(`[generatePpt] Processing SLIDE ${index + 1} of ${slides.length}`);
    console.log(`[generatePpt] Slide ${index + 1} id:`, slideDef.id);
    console.log(`[generatePpt] Slide ${index + 1} items count:`, slideDef.items.length);
    console.log(`[generatePpt] Slide ${index + 1} items (full):`, JSON.stringify(slideDef.items, null, 2));

    const slide = pptx.addSlide();
    console.log(`[generatePpt] Slide ${index + 1} - pptx.addSlide() returned:`, slide?.constructor?.name);

    console.log(`[generatePpt] Slide ${index + 1} - backgroundImage check START`);
    console.log(`[generatePpt] Slide ${index + 1} - settings.backgroundImage value:`, settings.backgroundImage);
    console.log(`[generatePpt] Slide ${index + 1} - settings.backgroundImage type:`, typeof settings.backgroundImage);
    console.log(`[generatePpt] Slide ${index + 1} - Boolean(settings.backgroundImage):`, Boolean(settings.backgroundImage));

    if (settings.backgroundImage) {
      const bgPath = settings.backgroundImage;
      console.log(`[generatePpt] Slide ${index + 1} - bgPath value:`, bgPath);
      console.log(`[generatePpt] Slide ${index + 1} - bgPath type:`, typeof bgPath);
      console.log(`[generatePpt] Slide ${index + 1} - bgPath === settings.backgroundImage:`, bgPath === settings.backgroundImage);

      if (typeof bgPath === 'string') {
        console.log(`[generatePpt] Slide ${index + 1} - bgPath is a string, checking fs.existsSync...`);
        console.log(`[generatePpt] Slide ${index + 1} - bgPath resolved:`, bgPath);
        const exists = fs.existsSync(bgPath);
        console.log(`[generatePpt] Slide ${index + 1} - fs.existsSync("${bgPath}"):`, exists);

        if (exists) {
          console.log(`[generatePpt] Slide ${index + 1} - Background file EXISTS, proceeding with addImage`);
          const imgOptions = {
            path: bgPath,
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5,
          };
          console.log(`[generatePpt] Slide ${index + 1} - addImage options:`, JSON.stringify(imgOptions, null, 2));
          try {
            console.log(`[generatePpt] Slide ${index + 1} - CALLING slide.addImage()...`);
            slide.addImage(imgOptions);
            console.log(`[generatePpt] Slide ${index + 1} - slide.addImage() SUCCEEDED`);
          } catch (err: any) {
            console.error(`[generatePpt] Slide ${index + 1} - addImage ERROR:`, err.message);
            console.error(`[generatePpt] Slide ${index + 1} - addImage error stack:`, err.stack);
            console.error(`[generatePpt] Slide ${index + 1} - addImage error full:`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
          }
        } else {
          console.warn(`[generatePpt] Slide ${index + 1} - Background file DOES NOT EXIST at path: "${bgPath}"`);
          console.warn(`[generatePpt] Slide ${index + 1} - Checking parent directory exists:`, fs.existsSync(bgPath ? bgPath.substring(0, bgPath.lastIndexOf('\\')) : ''));
          console.warn(`[generatePpt] Slide ${index + 1} - SKIPPING background image`);
        }
      } else {
        console.error(`[generatePpt] Slide ${index + 1} - bgPath is NOT a string! Type: ${typeof bgPath}`);
        console.error(`[generatePpt] Slide ${index + 1} - bgPath constructor: ${(bgPath as any)?.constructor?.name}`);
        console.error(`[generatePpt] Slide ${index + 1} - bgPath value:`, bgPath);
        console.error(`[generatePpt] Slide ${index + 1} - THIS IS LIKELY A BROWSER File OBJECT - SKIPPING`);
      }
    } else {
      console.log(`[generatePpt] Slide ${index + 1} - No backgroundImage configured or falsy`);
    }
    console.log(`[generatePpt] Slide ${index + 1} - backgroundImage check END`);

    console.log(`[generatePpt] Slide ${index + 1} - Processing ${slideDef.items.length} items...`);

    slideDef.items.forEach((item, itemIdx) => {
      console.log("");
      console.log(`  --- Slide ${index + 1}, Item ${itemIdx + 1} ---`);
      console.log(`  Item type:`, item.type);
      console.log(`  Item x:`, item.x, `y:`, item.y, `w:`, item.width, `h:`, item.height);
      console.log(`  Item content keys:`, Object.keys(item.content));
      console.log(`  Item content (full):`, JSON.stringify(item.content, null, 2));
      console.log(`  Item content.title:`, (item.content as any)?.title);
      console.log(`  Item content.question:`, (item.content as any)?.question);
      console.log(`  Item content.question type:`, typeof (item.content as any)?.question);

      if (item.type === 'question') {
        console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] Calling renderQuestionItem`);
        renderQuestionItem(slide, item, settings);
        console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] renderQuestionItem returned`);
        return;
      }

      if (item.type === 'sectionTitle') {
        console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] Processing sectionTitle`);
        const titleText = String(item.content?.title || '');
        console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] titleText: "${titleText}"`);
        console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] titleText length:`, titleText.length);

        const textOptions = {
          x: item.x,
          y: item.y,
          w: item.width,
          h: item.height,
          align: 'left' as const,
          valign: 'top' as const,
          wrap: true,
        };
        console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] addText options:`, JSON.stringify(textOptions, null, 2));

        try {
          console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] CALLING slide.addText()...`);
          slide.addText([{ text: titleText, options: { fontSize: settings.fontSize, color: settings.yearColor } }], textOptions);
          console.log(`  [Slide ${index + 1}, Item ${itemIdx + 1}] slide.addText() SUCCEEDED`);
        } catch (err: any) {
          console.error(`  [Slide ${index + 1}, Item ${itemIdx + 1}] addText error (sectionTitle):`, err.message);
          console.error(`  [Slide ${index + 1}, Item ${itemIdx + 1}] addText error stack:`, err.stack);
          console.error(`  [Slide ${index + 1}, Item ${itemIdx + 1}] addText error full:`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
        }
      }
    });
  });

  console.log("");
  console.log("========================================");
  console.log("[generatePpt] All slides processed. Calling pptx.writeFile()...");
  console.log("[generatePpt] writeFile fileName:", outputFilePath);
  console.log("[generatePpt] writeFile output dir exists:", fs.existsSync(outputFilePath ? outputFilePath.substring(0, outputFilePath.lastIndexOf('\\')) : ''));

  try {
    console.log("[generatePpt] CALLING pptx.writeFile()...");
    await pptx.writeFile({ fileName: outputFilePath });
    console.log("[generatePpt] pptx.writeFile() SUCCEEDED");
  } catch (err: any) {
    console.error("[generatePpt] writeFile ERROR:", err.message);
    console.error("[generatePpt] writeFile error stack:", err.stack);
    console.error("[generatePpt] writeFile error full:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.error("[generatePpt] writeFile error name:", err.name);
    console.error("[generatePpt] writeFile error code:", err.code);
    throw err;
  }

  console.log("[generatePpt] RETURN outputFilePath:", outputFilePath);
  console.log("========================================");
  return outputFilePath;
}
