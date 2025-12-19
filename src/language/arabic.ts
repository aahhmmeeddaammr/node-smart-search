export function normalizeArWord(word: string): string {
  return word
    .replace(/[^\u0600-\u06FF]/g, "")
    .replace(/^(ال|و|ب|ك|ل)/, "") // prefixes
    .replace(/(ات|ون|ين|ة|ه)$/g, "") // suffixes
    .trim();
}

export function tokenizeAr(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeArWord)
    .filter(w => w.length > 2);
}
