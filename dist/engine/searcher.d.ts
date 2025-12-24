import { SearchOptions, CacheProvider } from "../types";
/**
 * Calculate edit distance between two strings (Levenshtein distance)
 * Used for fuzzy matching
 */
declare function editDistance(a: string, b: string): number;
/**
 * Check if term is similar enough for fuzzy matching
 */
declare function isFuzzyMatch(term: string, target: string, maxDistance?: number): boolean;
/**
 * Smart search with term expansion, synonyms, fuzzy matching, and fallback strategies
 */
export declare function search(query: string, options: SearchOptions, mongo: any, cache?: CacheProvider): Promise<any[]>;
/**
 * Helper: Get search suggestions based on partial input
 */
export declare function getSearchSuggestions(partialQuery: string, mongo: any, options: SearchOptions, limit?: number): Promise<string[]>;
/**
 * Helper: Analyze query and return expansion info
 */
export declare function analyzeQuery(query: string, language?: string): {
    original: string;
    normalized: string;
    expansions: string[];
}[];
export { editDistance, isFuzzyMatch };
//# sourceMappingURL=searcher.d.ts.map