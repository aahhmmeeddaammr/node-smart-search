/**
 * Arabic stop words
 */
const ARABIC_STOP_WORDS = new Set([
  "في", "من", "إلى", "على", "عن", "مع", "هذا", "هذه", "ذلك", "تلك",
  "التي", "الذي", "التى", "الذى", "هو", "هي", "هم", "هن", "نحن", "أنت",
  "أنا", "كان", "كانت", "يكون", "تكون", "أن", "إن", "لا", "ما", "لم",
  "لن", "قد", "حتى", "إذا", "ثم", "أو", "و", "ف", "ب", "ل", "ك",
]);

/**
 * Common Arabic prefixes to remove
 */
const ARABIC_PREFIXES = ["ال", "و", "ب", "ك", "ل", "ف", "س", "لل"];

/**
 * Common Arabic suffixes to remove
 */
const ARABIC_SUFFIXES = ["ات", "ون", "ين", "ان", "ة", "ه", "ها", "هم", "هن", "ي", "نا", "كم", "كن"];

/**
 * Normalize a single Arabic word
 * Removes diacritics, prefixes, and suffixes
 */
export function normalizeArWord(word: string): string {
  let normalized = word
    // Remove non-Arabic characters except spaces
    .replace(/[^\u0600-\u06FF\s]/g, "")
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize Alef variations
    .replace(/[أإآ]/g, "ا")
    // Normalize Yaa variations
    .replace(/ى/g, "ي")
    // Normalize Taa Marbouta
    .replace(/ة/g, "ه")
    .trim();

  // Remove common prefixes
  for (const prefix of ARABIC_PREFIXES) {
    if (normalized.startsWith(prefix) && normalized.length > prefix.length + 2) {
      normalized = normalized.slice(prefix.length);
      break; // Only remove one prefix
    }
  }

  // Remove common suffixes
  for (const suffix of ARABIC_SUFFIXES) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length + 2) {
      normalized = normalized.slice(0, -suffix.length);
      break; // Only remove one suffix
    }
  }

  return normalized;
}

/**
 * Tokenize Arabic text
 * @param text - Input Arabic text
 * @param options - Tokenization options
 * @returns Array of normalized tokens
 */
export function tokenizeAr(
  text: string,
  options: {
    minLength?: number;
    removeStopWords?: boolean;
  } = {}
): string[] {
  const { minLength = 1, removeStopWords = false } = options;

  const tokens = text
    .split(/\s+/)
    .map(normalizeArWord)
    .filter((w) => {
      if (w.length < minLength) return false;
      if (removeStopWords && ARABIC_STOP_WORDS.has(w)) return false;
      return true;
    });

  // Remove duplicates while preserving order
  return [...new Set(tokens)];
}

/**
 * Check if a word is an Arabic stop word
 */
export function isArabicStopWord(word: string): boolean {
  return ARABIC_STOP_WORDS.has(word);
}

/**
 * Get the set of Arabic stop words
 */
export function getArabicStopWords(): Set<string> {
  return new Set(ARABIC_STOP_WORDS);
}
