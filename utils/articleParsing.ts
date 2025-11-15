import { parseDocument } from 'htmlparser2';

// Utilities for article parsing and section extraction used by article renderers

export const DEFAULT_SELECTORS_TO_REMOVE = [
 '.mw-editsection',
 '.hatnote',
 '.navbox',
 '.catlinks',
 '.printfooter',
 '.portal',
 '.portal-bar',
 '.sister-bar',
 '.sistersitebox',
 '.sidebar',
 '.shortdescription',
 '.nomobile',
 '.mw-empty-elt',
 '.mw-valign-text-top',
 '.plainlinks',
 'style'
];

/**
* Synchronous wrapper around htmlparser2.parseDocument so callers import a single shared helper.
* Keeping the parsing centralized avoids scattering direct htmlparser2 imports across the codebase.
*/
export function parseHtml(html: string) {
 if (!html || typeof html !== 'string') {
   throw new Error('Invalid HTML input');
 }
 try {
   const doc = parseDocument(html);
   return doc;
 } catch (err) {
   // Re-throw so callers can handle fallback rendering
   throw err;
 }
}

export function extractInfobox(html: string) {
 const infoboxRegex = /<table[^>]*class=["'][^"']*infobox[^"']*["'][\s\S]*?<\/table>/i;
 const match = html.match(infoboxRegex);
 if (!match) return { infoboxHtml: '', remaining: html };
 const infoboxHtml = match[0];
 const remaining = html.replace(infoboxRegex, '');
 return { infoboxHtml, remaining };
}

export function extractIntro(html: string) {
 const h2Regex = /<h2[^>]*>/i;
 const idx = html.search(h2Regex);
 if (idx === -1) {
   return { introHtml: html, remaining: '' };
 }
 const introHtml = html.slice(0, idx);
 const remaining = html.slice(idx);
 return { introHtml, remaining };
}

export function splitIntoSections(html: string) {
 const sections: { id: string; heading: string; html: string }[] = [];
 if (!html || html.trim() === '') return sections;

 const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
 let m: RegExpExecArray | null;
 const matches: { index: number; headingText: string }[] = [];
 while ((m = h2Regex.exec(html)) !== null) {
   matches.push({ index: m.index, headingText: m[1] || '' });
 }

 if (matches.length === 0) {
   sections.push({ id: 'section-0', heading: 'Content', html });
   return sections;
 }

 for (let i = 0; i < matches.length; i++) {
   const start = matches[i].index;
   const headingText = matches[i].headingText.replace(/<[^>]*>/g, '').trim() || 'Section';
   const nextStart = i + 1 < matches.length ? matches[i + 1].index : html.length;
   const sectionHtml = html.slice(start, nextStart);
   sections.push({
     id: `section-${i}`,
     heading: headingText,
     html: sectionHtml
   });
 }

 return sections;
}