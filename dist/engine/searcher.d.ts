import { SearchOptions, CacheProvider } from "../types";
/**
 * Smart search with term expansion, synonyms, and fuzzy matching
 */
export declare function search(query: string, options: SearchOptions, mongo: any, cache?: CacheProvider): Promise<{}>;
/**
 * Helper: Get search suggestions based on partial input
 */
export declare function getSearchSuggestions(partialQuery: string, mongo: any, options: SearchOptions, limit?: number): Promise<string[]>;
/**
 * Helper: Analyze query and return expansion info
 */
export declare function analyzeQuery(query: string, language?: string): any;
//# sourceMappingURL=searcher.d.ts.map