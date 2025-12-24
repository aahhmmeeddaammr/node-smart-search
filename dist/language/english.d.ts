/**
 * Normalize a single English word to its canonical form
 * Handles: plurals, verb conjugations, comparatives, superlatives, gerunds, adverbs
 *
 * Examples:
 * - latest → late
 * - gaming → game
 * - running → run
 * - better → good (via stemmer)
 */
export declare function normalizeEnWord(word: string): string;
/**
 * Tokenize text into normalized canonical forms
 *
 * @param text - Input text to tokenize
 * @param options - Configuration options
 * @returns Array of normalized tokens
 */
export declare function tokenizeEn(text: string, options?: {
    minLength?: number;
    removeStopWords?: boolean;
    preserveNumbers?: boolean;
    keepShortValidWords?: boolean;
}): string[];
/**
 * Check if a word is a valid short word that should be kept
 */
export declare function isValidShortWord(word: string): boolean;
/**
 * Get the set of stop words
 */
export declare function getStopWords(): Set<string>;
//# sourceMappingURL=english.d.ts.map