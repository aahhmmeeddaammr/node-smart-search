import { getSearchSuggestions, analyzeQuery, editDistance, isFuzzyMatch } from "./engine/searcher";
import { SearchOptions, CacheProvider, IndexStorage } from "./types";
/**
 * SmartSearch - A powerful, flexible search engine for Node.js
 *
 * Features:
 * - Multi-language support (English & Arabic)
 * - Fuzzy matching for typo tolerance
 * - Synonym and abbreviation expansion
 * - Prefix and regex fallback search
 * - Redis caching support
 * - Works with both MongoDB driver and Mongoose
 *
 * @example
 * ```typescript
 * // With Mongoose
 * const SearchIndex = mongoose.model('SearchIndex', searchIndexSchema);
 * const mongo = new MongoIndex(SearchIndex);
 * const engine = new SmartSearch(mongo);
 *
 * // With MongoDB driver
 * const collection = db.collection('search_index');
 * const mongo = new MongoIndex(collection);
 * const engine = new SmartSearch(mongo);
 * ```
 */
export declare class SmartSearch {
    private mongo;
    private cache?;
    /**
     * Create a new SmartSearch instance
     * @param mongo - Index storage implementation (MongoIndex)
     * @param cache - Optional cache provider (RedisCache)
     */
    constructor(mongo: IndexStorage, cache?: CacheProvider);
    /**
     * Index a document for searching
     *
     * Documents should have fields prefixed with `s__` to be indexed:
     * - `s__title` - Will be indexed
     * - `s__description` - Will be indexed
     * - `name` - Will NOT be indexed
     *
     * @param doc - Document to index (must have _id and s__* fields)
     * @param collection - Collection name for grouping
     * @param lang - Language for tokenization ('en' or 'ar')
     *
     * @example
     * ```typescript
     * await engine.index({
     *   _id: 'prod_1',
     *   s__title: 'iPhone 16 Pro',
     *   s__description: 'Latest smartphone',
     *   price: 999 // Not indexed
     * }, 'products', 'en');
     * ```
     */
    index(doc: any, collection: string, lang?: "en" | "ar"): Promise<void>;
    /**
     * Search for documents
     *
     * @param q - Search query string
     * @param options - Search configuration options
     * @returns Array of matching document IDs, sorted by relevance
     *
     * @example
     * ```typescript
     * // Basic search
     * const ids = await engine.search('iphone', { collection: 'products' });
     *
     * // With options
     * const ids = await engine.search('iphon', {
     *   collection: 'products',
     *   enableFuzzy: true,      // Match 'iphone' even with typo
     *   fallbackToIncludes: true // Use substring matching
     * });
     * ```
     */
    search(q: string, options: SearchOptions): Promise<any[]>;
    /**
     * Get search suggestions for autocomplete
     *
     * @param partialQuery - Partial search query
     * @param options - Search options
     * @param limit - Maximum number of suggestions
     * @returns Array of suggested search terms
     *
     * @example
     * ```typescript
     * const suggestions = await engine.getSuggestions('iph', { collection: 'products' });
     * // Returns: ['iphone', 'iphoto', ...]
     * ```
     */
    getSuggestions(partialQuery: string, options: SearchOptions, limit?: number): Promise<string[]>;
    /**
     * Analyze a query to see how it will be processed
     * Useful for debugging and understanding search behavior
     *
     * @param query - Search query to analyze
     * @param language - Language for analysis
     * @returns Analysis results with tokens and expansions
     */
    analyzeQuery(query: string, language?: "en" | "ar"): any;
}
export * from "./types";
export * from "./cache/redis";
export * from "./storage/mongo";
export { tokenizeEn, normalizeEnWord, isValidShortWord, getStopWords } from "./language/english";
export { tokenizeAr, normalizeArWord, isArabicStopWord, getArabicStopWords } from "./language/arabic";
export { editDistance, isFuzzyMatch, getSearchSuggestions, analyzeQuery };
//# sourceMappingURL=index.d.ts.map