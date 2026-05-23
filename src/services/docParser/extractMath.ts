import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { logger } from '../../utils/logger';

const SUPERSCRIPTS: Record<string, string> = {
  '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3',
  '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077',
  '8': '\u2078', '9': '\u2079', '+': '\u207A', '-': '\u207B',
  '=': '\u207C', '(': '\u207D', ')': '\u207E', 'n': '\u207F',
};

const SUBSCRIPTS: Record<string, string> = {
  '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083',
  '4': '\u2084', '5': '\u2085', '6': '\u2086', '7': '\u2087',
  '8': '\u2088', '9': '\u2089', '+': '\u208A', '-': '\u208B',
  '(': '\u208D', ')': '\u208E',
};

function toSuperscript(text: string): string {
  return text.split('').map(c => SUPERSCRIPTS[c] || c).join('');
}

function toSubscript(text: string): string {
  return text.split('').map(c => SUBSCRIPTS[c] || c).join('');
}

function getTextContent(node: Node): string {
  let result = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 3) {
      result += child.nodeValue || '';
    } else if (child.nodeType === 1) {
      result += getTextContent(child);
    }
  }
  return result;
}

function getTagName(node: Node | null): string {
  if (!node || node.nodeType !== 1) return '';
  const localName = (node as Element).localName || (node as Element).tagName;
  return localName ? localName.replace(/^.*:/, '') : '';
}

function getDirectChildByTagName(parent: Element, tagName: string): Element | null {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i];
    if (child.nodeType === 1 && getTagName(child) === tagName) {
      return child as Element;
    }
  }
  return null;
}

function convertOmmToText(dom: Document): { eqText: string; hasMath: boolean }[] {
  const results: { eqText: string; hasMath: boolean }[] = [];

  const paragraphs = dom.getElementsByTagNameNS?.('*', 'p') || dom.getElementsByTagName('w:p');

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    const mathElements = findMathElements(para);

    if (mathElements.length === 0) continue;

    const parts: string[] = [];
    let lastEnd = 0;

    const allRuns = getTextRunsInOrder(para);
    for (const math of mathElements) {
      const eqText = convertSingleMath(math);
      parts.push(eqText);
    }

    results.push({
      eqText: parts.join(' '),
      hasMath: true,
    });
  }

  return results;
}

function getTextRunsInOrder(para: Element): Element[] {
  const runs: Element[] = [];
  for (let i = 0; i < para.childNodes.length; i++) {
    const child = para.childNodes[i];
    const tag = getTagName(child);
    if (tag === 'r' || tag === 'hyperlink') {
      if (child.nodeType === 1) runs.push(child as Element);
    }
  }
  return runs;
}

function findMathElements(node: Node): Element[] {
  const mathElements: Element[] = [];

  if (node.nodeType === 1) {
    const tag = getTagName(node);
    if (tag === 'oMath' || tag === 'oMathPara') {
      mathElements.push(node as Element);
      return mathElements;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1) {
        mathElements.push(...findMathElements(child as Element));
      }
    }
  }

  return mathElements;
}

function convertSingleMath(mathEl: Element): string {
  const textRuns = collectMathTextRuns(mathEl);
  return textRuns.join(' ');
}

function collectMathTextRuns(node: Node): string[] {
  const results: string[] = [];
  const tag = getTagName(node);

  if (tag === 't') {
    const text = getTextContent(node).trim();
    if (text) results.push(text);
    return results;
  }

  if (tag === 'sup') {
    const inner = collectMathTextRunsAll(node);
    return [toSuperscript(inner.join(''))];
  }

  if (tag === 'sub') {
    const inner = collectMathTextRunsAll(node);
    return [toSubscript(inner.join(''))];
  }

  if (tag === 'frac') {
    const numEl = getDirectChildByTagName(node as Element, 'num');
    const denEl = getDirectChildByTagName(node as Element, 'den');
    const num = numEl ? collectMathTextRunsAll(numEl).join('') : '?';
    const den = denEl ? collectMathTextRunsAll(denEl).join('') : '?';
    return [num + '/' + den];
  }

  if (tag === 'rad') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const deg = getDirectChildByTagName(node as Element, 'deg');
    const radicand = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    if (deg) {
      const d = collectMathTextRunsAll(deg).join('');
      return ['\u221B[' + d + '](' + radicand + ')'];
    }
    return ['\u221A(' + radicand + ')'];
  }

  if (tag === 'nary') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const sub = getDirectChildByTagName(node as Element, 'sub');
    const sup = getDirectChildByTagName(node as Element, 'sup');
    const body = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    const lower = sub ? collectMathTextRunsAll(sub).join('') : '';
    const upper = sup ? collectMathTextRunsAll(sup).join('') : '';
    let prefix = '\u2211';
    const chars = collectMathTextRunsAll(node);
    if (chars.some(c => c.includes('\u222B') || c.includes('int'))) prefix = '\u222B';
    else if (chars.some(c => c.includes('\u220F') || c.includes('prod'))) prefix = '\u220F';

    let result = prefix;
    if (lower) result += toSubscript(lower);
    if (upper) result += toSuperscript(upper);
    result += ' ' + body;
    return [result];
  }

  if (tag === 'acc') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const accPr = getDirectChildByTagName(node as Element, 'accPr');
    let accent = '\u0302';
    if (accPr) {
      const chrEl = getDirectChildByTagName(accPr, 'chr');
      if (chrEl) {
        const val = chrEl.getAttribute('m:val') || chrEl.textContent || '\u0302';
        accent = val;
      }
    }
    const base = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    return [base + accent];
  }

  if (tag === 'bar') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const base = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    return ['\u0305' + base];
  }

  if (tag === 'd') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const dPr = getDirectChildByTagName(node as Element, 'dPr');
    let open = '(';
    let close = ')';
    if (dPr) {
      const sepChr = getDirectChildByTagName(dPr, 'sepChr');
      const begChr = getDirectChildByTagName(dPr, 'begChr');
      const endChr = getDirectChildByTagName(dPr, 'endChr');
      if (begChr) open = begChr.getAttribute('m:val') || begChr.textContent || '(';
      if (endChr) close = endChr.getAttribute('m:val') || endChr.textContent || ')';
    }
    const inner = eArg ? collectMathTextRunsAll(eArg).join('') : '';
    return [open + inner + close];
  }

  if (tag === 'groupChr') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const inner = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    return ['(' + inner + ')'];
  }

  if (tag === 'eqArr') {
    const eArgs = getChildrenByTagName(node as Element, 'e');
    const parts = eArgs.map(e => collectMathTextRunsAll(e).join(''));
    const rows = [];
    for (let i = 0; i < parts.length; i += 2) {
      rows.push(parts[i] + (parts[i + 1] ? ' = ' + parts[i + 1] : ''));
    }
    if (rows.length === 0) {
      rows.push(parts.join(' '));
    }
    return rows;
  }

  if (tag === 'func') {
    const fName = getDirectChildByTagName(node as Element, 'fName');
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const name = fName ? collectMathTextRunsAll(fName).join('') : 'func';
    const body = eArg ? collectMathTextRunsAll(eArg).join('') : '';
    return [name + '(' + body + ')'];
  }

  if (tag === 'limLow') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const lim = getDirectChildByTagName(node as Element, 'lim');
    const base = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    const lower = lim ? collectMathTextRunsAll(lim).join('') : '';
    return [base + toSubscript(lower)];
  }

  if (tag === 'limUpp') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const lim = getDirectChildByTagName(node as Element, 'lim');
    const base = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    const upper = lim ? collectMathTextRunsAll(lim).join('') : '';
    return [base + toSuperscript(upper)];
  }

  if (tag === 'sSub') {
    const eArg = getDirectChildByTagName(node as Element, 'e');
    const subEl = getDirectChildByTagName(node as Element, 'sub');
    const supEl = getDirectChildByTagName(node as Element, 'sup');
    const base = eArg ? collectMathTextRunsAll(eArg).join('') : '?';
    const sub = subEl ? collectMathTextRunsAll(subEl).join('') : '';
    const sup = supEl ? toSuperscript(collectMathTextRunsAll(supEl).join('')) : '';
    return [base + toSubscript(sub) + sup];
  }

  if (tag === 'r') {
    let parts: string[] = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      const ct = getTagName(child);
      if (ct === 't') {
        const text = getTextContent(child);
        parts.push(text);
      } else if (ct === 'rPr') {
      } else if (child.nodeType === 1) {
        const inner = collectMathTextRuns(child as Element);
        parts.push(...inner);
      }
    }
    const result = parts.join('');
    if (result.trim()) return [result];
    return [];
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 1) {
      const inner = collectMathTextRuns(child as Element);
      results.push(...inner);
    }
  }

  return results;
}

function collectMathTextRunsAll(node: Node): string[] {
  const results: string[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 1) {
      const inner = collectMathTextRuns(child as Element);
      results.push(...inner);
    }
  }
  return results;
}

function getChildrenByTagName(parent: Element, tagName: string): Element[] {
  const results: Element[] = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i];
    if (child.nodeType === 1 && getTagName(child) === tagName) {
      results.push(child as Element);
    }
  }
  return results;
}

export async function extractEquationsFromDocx(buffer: Buffer): Promise<string[]> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      logger.warn('[extractMath] No word/document.xml found in DOCX');
      return [];
    }

    const xmlContent = await docXmlFile.async('string');
    const parser = new DOMParser();
    const dom = parser.parseFromString(xmlContent, 'text/xml');

    const mathEls = findMathElements(dom);
    logger.info('[extractMath] Found', mathEls.length, 'math elements in document');

    const equations: string[] = [];
    for (const mathEl of mathEls) {
      const text = convertSingleMath(mathEl as Element);
      if (text.trim()) {
        equations.push(text.trim());
      }
    }

    logger.info('[extractMath] Extracted', equations.length, 'equation texts');
    logger.debug('[extractMath] Equations:', equations.join(' | '));
    return equations;
  } catch (error: any) {
    logger.error('[extractMath] Failed to extract equations:', error.message);
    return [];
  }
}

export function convertOmmXmlString(ommXml: string): string {
  try {
    const parser = new DOMParser();
    const dom = parser.parseFromString(ommXml, 'text/xml');
    const mathElement = dom.documentElement;
    if (mathElement) {
      const text = convertSingleMath(mathElement);
      return text || '';
    }
  } catch {
    // fallback: strip tags
    return ommXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

export type { };
