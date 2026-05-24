import mammoth from 'mammoth';
import JSZip from 'jszip';
import type { PptSettings } from '../../types/settings';
import { PptSettingsSchema } from '../../types/settings';
import { convertOmmXmlString } from './extractMath';

export interface TableCell {
  text: string;
  colspan?: number;
  rowspan?: number;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableData {
  rows: TableRow[];
}

export interface Question {
  id: number;
  questionNo: string;
  text: string;
  options: string[];
  year?: string;
  answer?: string;
  images?: string[];
  tables?: TableData[];
}

export interface Section {
  title: string;
  questions: Question[];
}

export interface ParsedDocument {
  sections: Section[];
}

type ParsedBlock = {
  text: string;
  html: string;
  images: string[];
  tableData?: TableData;
};

const DEFAULT_SECTION_TITLE = 'General';
const HINDI_QUESTION = '\u092a\u094d\u0930\u0936\u094d\u0928';
const HINDI_ANSWER = '\u0909\u0924\u094d\u0924\u0930';

const questionPattern = new RegExp(
  `^(?:(?:${HINDI_QUESTION}|Q(?:uestion)?)\\s*)?(\\d{1,3})([.)])\\s+(.+)$`,
  'i',
);
const optionPattern = /^(?:\(([a-d])\)|([a-d])[.)])\s*(.*)$/i;
const answerPattern = new RegExp(
  `^(?:${HINDI_ANSWER}|answer|ans)\\s*[:\\-\\u2013\\u2014]?\\s*(.+)$`,
  'i',
);
const yearPattern = /\[(\d{4})\]/;
const headingKeywords = [
  'SECTION',
  '\u0916\u0902\u0921',
  '\u092d\u093e\u0917',
  '\u0935\u093f\u0937\u092f',
  '\u092a\u094d\u0930\u0936\u094d\u0928 \u092a\u0924\u094d\u0930',
  'SET',
  'PART',
  '\u0938\u0924\u094d\u0930',
  '\u0938\u092e\u0942\u0939',
  '\u092a\u0947\u092a\u0930',
  '\u0905\u0927\u094d\u092f\u093e\u092f',
];

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(parseInt(code, 10)));
}

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

  const containsBold = /<strong>|<b\b|<w:b\b/i.test(blockHtml);
  const isShort = trimmed.length <= 120 && trimmed.split(/\s+/).length <= 10;
  const notMetadata = !parseOptionLine(trimmed) && !answerPattern.test(trimmed) && !questionPattern.test(trimmed);

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

function extractBlocks(html: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
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

function extractXmlAttribute(tag: string, attributeName: string): string | null {
  const escapedName = attributeName.replace(':', '\\:');
  const match = tag.match(new RegExp(`\\b${escapedName}=["']([^"']+)["']`));
  return match?.[1] ?? null;
}

function mimeTypeFromPath(filePath: string): string {
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lowerPath.endsWith('.gif')) {
    return 'image/gif';
  }
  if (lowerPath.endsWith('.webp')) {
    return 'image/webp';
  }
  if (lowerPath.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  return 'image/png';
}

function normalizeZipPath(target: string): string {
  const normalizedTarget = target.replace(/\\/g, '/');
  const parts = normalizedTarget.startsWith('/')
    ? normalizedTarget.slice(1).split('/')
    : ['word', ...normalizedTarget.split('/')];
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }

  return stack.join('/');
}

function parseRelationships(relsXml: string): Map<string, string> {
  const relationships = new Map<string, string>();
  const relPattern = /<Relationship\b[^>]*>/g;
  let match: RegExpExecArray | null = null;

  while ((match = relPattern.exec(relsXml)) !== null) {
    const tag = match[0];
    const id = extractXmlAttribute(tag, 'Id');
    const target = extractXmlAttribute(tag, 'Target');
    const type = extractXmlAttribute(tag, 'Type') ?? '';

    if (id && target && type.includes('/image')) {
      relationships.set(id, target);
    }
  }

  return relationships;
}

function extractParagraphText(paragraphXml: string): string {
  const parts: string[] = [];
  const tokenPattern = /<m:oMath[\s\S]*?<\/m:oMath>|<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g;
  let match: RegExpExecArray | null = null;

  while ((match = tokenPattern.exec(paragraphXml)) !== null) {
    if (match[0].startsWith('<m:oMath')) {
      const mathText = convertOmmXmlString(match[0]);
      if (mathText) {
        parts.push(mathText);
      }
      continue;
    }

    if (typeof match[1] === 'string') {
      parts.push(decodeHtmlEntities(match[1]));
      continue;
    }

    parts.push(' ');
  }

  return parts.join('').replace(/[ \t]+/g, ' ').trim();
}

function extractImageRelationshipIds(paragraphXml: string): string[] {
  const ids: string[] = [];
  const blipPattern = /<a:blip\b[^>]*(?:r:embed|r:link)=["']([^"']+)["'][^>]*>/g;
  const imageDataPattern = /<v:imagedata\b[^>]*r:id=["']([^"']+)["'][^>]*>/g;
  let match: RegExpExecArray | null = null;

  while ((match = blipPattern.exec(paragraphXml)) !== null) {
    ids.push(match[1]);
  }

  while ((match = imageDataPattern.exec(paragraphXml)) !== null) {
    ids.push(match[1]);
  }

  return ids;
}

function extractTableText(tableXml: string): string {
  const rows = tableXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) ?? [];

  return rows
    .map((rowXml) => {
      const cells = rowXml.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) ?? [];
      return cells
        .map((cellXml) => {
          const cellParagraphs = cellXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) ?? [];
          return cellParagraphs
            .map(extractParagraphText)
            .filter(Boolean)
            .join(' ');
        })
        .filter(Boolean)
        .join(' | ');
    })
    .filter(Boolean)
    .join('\n');
}

function getXmlAttr(tag: string, attr: string): string | null {
  const esc = attr.replace(':', '\\:');
  const m = tag.match(new RegExp(`\\b${esc}=["']([^"']+)["']`));
  return m?.[1] ?? null;
}

function parseTableXml(tableXml: string): TableData {
  const rows: TableRow[] = [];
  const rowMatches = tableXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) ?? [];

  for (const rowXml of rowMatches) {
    const cells: TableCell[] = [];
    const cellMatches = rowXml.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) ?? [];

    for (const cellXml of cellMatches) {
      const tcPr = cellXml.match(/<w:tcPr[\s\S]*?<\/w:tcPr>/)?.[0] ?? '';
      let colspan = 1;
      let rowspan = 1;

      const gridSpanMatch = tcPr.match(/<w:gridSpan\s+[^>]*w:val=["'](\d+)["']/);
      if (gridSpanMatch) colspan = parseInt(gridSpanMatch[1], 10) || 1;

      const vMergeMatch = tcPr.match(/<w:vMerge\s+[^>]*w:val=["'](\w+)["']/);
      if (vMergeMatch && vMergeMatch[1] === 'restart') rowspan = 2;

      const cellParagraphs = cellXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) ?? [];
      const cellText = cellParagraphs
        .map((p) => extractParagraphText(p))
        .filter(Boolean)
        .join('\n');

      cells.push({ text: cellText, colspan, rowspan });
    }

    rows.push({ cells });
  }

  return { rows };
}

async function extractDocxBlocksFromXml(buffer: Buffer): Promise<ParsedBlock[]> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXmlFile = zip.file('word/document.xml');

  if (!documentXmlFile) {
    return [];
  }

  const [documentXml, relsXml] = await Promise.all([
    documentXmlFile.async('string'),
    zip.file('word/_rels/document.xml.rels')?.async('string') ?? Promise.resolve(''),
  ]);
  const relationships = parseRelationships(relsXml);
  const imageCache = new Map<string, string>();
  const bodyXml = documentXml.match(/<w:body\b[\s\S]*?<\/w:body>/)?.[0] ?? documentXml;
  const documentBlocks = bodyXml.match(/<w:p\b[\s\S]*?<\/w:p>|<w:tbl\b[\s\S]*?<\/w:tbl>/g) ?? [];
  const blocks: ParsedBlock[] = [];

  for (const blockXml of documentBlocks) {
    const text = blockXml.startsWith('<w:tbl')
      ? extractTableText(blockXml)
      : extractParagraphText(blockXml);
    const images: string[] = [];

    for (const relationshipId of extractImageRelationshipIds(blockXml)) {
      const target = relationships.get(relationshipId);
      if (!target) {
        continue;
      }

      const mediaPath = normalizeZipPath(target);
      if (!imageCache.has(mediaPath)) {
        const imageFile = zip.file(mediaPath);
        if (!imageFile) {
          continue;
        }

        const imageBase64 = await imageFile.async('base64');
        imageCache.set(mediaPath, `data:${mimeTypeFromPath(mediaPath)};base64,${imageBase64}`);
      }

      const image = imageCache.get(mediaPath);
      if (image) {
        images.push(image);
      }
    }

    let tableData: TableData | undefined;
    if (blockXml.startsWith('<w:tbl')) {
      tableData = parseTableXml(blockXml);
    }

    if (text || images.length > 0 || tableData) {
      blocks.push({ text, html: blockXml, images, tableData });
    }
  }

  return blocks;
}

async function extractDocxBlocks(buffer: Buffer): Promise<ParsedBlock[]> {
  try {
    const xmlBlocks = await extractDocxBlocksFromXml(buffer);
    if (xmlBlocks.length > 0) {
      return xmlBlocks;
    }
  } catch {
    // Fall back to Mammoth for non-standard DOCX packages.
  }

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

  return extractBlocks(html);
}

function parseOptionLine(line: string): { label: string; text: string } | null {
  const match = line.match(optionPattern);
  if (!match) {
    return null;
  }

  return {
    label: (match[1] ?? match[2] ?? '').toLowerCase(),
    text: (match[3] ?? '').trim(),
  };
}

function cleanAnswer(answer: string): string {
  return answer
    .trim()
    .replace(/^[(:\-\u2013\u2014\s]+/, '')
    .replace(/[)\]\s]+$/, '')
    .replace(/^\(([a-d0-9]+)\)$/i, '$1')
    .trim();
}

function formatOption(label: string, text: string): string {
  return text ? `(${label}) ${text}` : `(${label})`;
}

function removeYearTag(text: string): { text: string; year: string | undefined } {
  const yearMatch = text.match(yearPattern);
  if (!yearMatch) {
    return { text, year: undefined };
  }

  return {
    text: text.replace(yearPattern, '').trim(),
    year: yearMatch[1],
  };
}

function isLikelyNumberedSectionHeading(line: string, nextLine: string | null): string | null {
  const questionMatch = line.match(questionPattern);
  if (!questionMatch || yearPattern.test(line) || answerPattern.test(line) || parseOptionLine(line)) {
    return null;
  }

  const headingText = (questionMatch[3] ?? '').trim();
  if (!headingText) {
    return null;
  }

  const wordCount = headingText.split(/\s+/).filter(Boolean).length;
  const isShort = headingText.length <= 90 && wordCount <= 10;
  const nextLooksLikeQuestion = nextLine ? questionPattern.test(nextLine) : false;
  const endsLikeQuestion = /[?？]|[।.]$/.test(headingText);

  return isShort && nextLooksLikeQuestion && !endsLikeQuestion ? headingText : null;
}

function getNextTextLine(entries: ParsedBlock[], startIndex: number): string | null {
  for (let index = startIndex; index < entries.length; index += 1) {
    const nextText = entries[index].text.trim();
    if (nextText) {
      return nextText;
    }
  }

  return null;
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
  const blocks = await extractDocxBlocks(buffer);
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

  const startSection = (title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    if (currentSection.title === DEFAULT_SECTION_TITLE && currentSection.questions.length === 0) {
      currentSection.title = cleanTitle;
    } else {
      currentSection = {
        title: cleanTitle,
        questions: [],
      };
      sections.push(currentSection);
    }

    currentQuestion = null;
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

  const entries = blocks.flatMap((block) => {
    const textEntries = splitTextIntoLines(block.text).map((line) => ({
      text: line,
      html: block.html,
      images: [] as string[],
    }));

    if (block.images.length === 0) {
      return textEntries;
    }

    return [
      ...textEntries,
      {
        text: '',
        html: block.html,
        images: block.images,
      },
    ];
  });

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    for (const src of entry.images) {
      addOrAttachImage(src);
    }

    if (entry.html.startsWith('<w:tbl') && currentQuestion) {
      const tbl = parseTableXml(entry.html);
      if (tbl.rows.length > 0) {
        if (!currentQuestion.tables) currentQuestion.tables = [];
        currentQuestion.tables.push(tbl);
      }
    }

    if (!entry.text) {
      continue;
    }

    const line = entry.text;
    const questionMatch = line.match(questionPattern);
    const answerMatch = line.match(answerPattern);
    const optionMatch = parseOptionLine(line);
    const yearMatch = line.match(yearPattern);
    const blockLooksLikeHeading = isHeadingLine(line, entry.html);
    const nextTextLine = getNextTextLine(entries, index + 1);

    const sectionHeading = isLikelyNumberedSectionHeading(line, nextTextLine);
    if (sectionHeading) {
      startSection(sectionHeading);
      continue;
    }

    if (questionMatch) {
      const questionNo = questionMatch[1]?.trim() ?? '';
      const { text: remainder, year } = removeYearTag(questionMatch[3]?.trim() ?? '');
      currentQuestion = createQuestion(questionNo);

      if (year) {
        currentQuestion.year = year;
      } else if (yearMatch) {
        currentQuestion.year = yearMatch[1];
      }

      if (answerMatch) {
        currentQuestion.answer = cleanAnswer(answerMatch[1]);
      }

      if (remainder) {
        appendTextToQuestion(currentQuestion, remainder);
      }

      continue;
    }

    if (blockLooksLikeHeading && currentSection.questions.length === 0 && !currentQuestion) {
      startSection(line);
      continue;
    }

    if (optionMatch) {
      const question = currentQuestion ?? createQuestion('');
      question.options.push(formatOption(optionMatch.label, optionMatch.text));
      continue;
    }

    if (answerMatch) {
      const question = currentQuestion ?? createQuestion('');
      question.answer = cleanAnswer(answerMatch[1] ?? '');
      currentQuestion = null;
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

    if (blockLooksLikeHeading && line.length <= 120 && line.split(/\s+/).length <= 12 && !currentQuestion) {
      startSection(line);
      continue;
    }

    if (!currentQuestion) {
      startSection(line);
      continue;
    }

    appendTextToQuestion(currentQuestion, line);
  }

  return {
    sections: sections.filter((section) => section.questions.length > 0 || section.title !== DEFAULT_SECTION_TITLE),
  };
}
