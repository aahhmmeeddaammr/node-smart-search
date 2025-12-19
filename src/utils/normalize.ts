/**
 * Text normalization utilities
 */

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function removePunctuation(text: string): string {
  return text.replace(/[^\p{L}\p{N}\s]/gu, ' ');
}

export function toLowerCase(text: string): string {
  return text.toLowerCase();
}

export function normalizeText(text: string): string {
  return normalizeWhitespace(
    removePunctuation(toLowerCase(text))
  );
}

export function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function extractWords(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter(word => word.length > 0);
}

