/**
 * Normalize a single Arabic word
 * Removes diacritics, prefixes, and suffixes
 */
export declare function normalizeArWord(word: string): string;
/**
 * Tokenize Arabic text
 * @param text - Input Arabic text
 * @param options - Tokenization options
 * @returns Array of normalized tokens
 */
export declare function tokenizeAr(text: string, options?: {
    minLength?: number;
    removeStopWords?: boolean;
}): string[];
/**
 * Check if a word is an Arabic stop word
 */
export declare function isArabicStopWord(word: string): boolean;
/**
 * Get the set of Arabic stop words
 */
export declare function getArabicStopWords(): Set<string>;
//# sourceMappingURL=arabic.d.ts.map