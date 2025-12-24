"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeQuery = exports.getSearchSuggestions = exports.isFuzzyMatch = exports.editDistance = exports.getArabicStopWords = exports.isArabicStopWord = exports.normalizeArWord = exports.tokenizeAr = exports.getStopWords = exports.isValidShortWord = exports.normalizeEnWord = exports.tokenizeEn = exports.SmartSearch = void 0;
const indexer_1 = require("./engine/indexer");
const searcher_1 = require("./engine/searcher");
Object.defineProperty(exports, "getSearchSuggestions", { enumerable: true, get: function () { return searcher_1.getSearchSuggestions; } });
Object.defineProperty(exports, "analyzeQuery", { enumerable: true, get: function () { return searcher_1.analyzeQuery; } });
Object.defineProperty(exports, "editDistance", { enumerable: true, get: function () { return searcher_1.editDistance; } });
Object.defineProperty(exports, "isFuzzyMatch", { enumerable: true, get: function () { return searcher_1.isFuzzyMatch; } });
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
class SmartSearch {
    /**
     * Create a new SmartSearch instance
     * @param mongo - Index storage implementation (MongoIndex)
     * @param cache - Optional cache provider (RedisCache)
     */
    constructor(mongo, cache) {
        this.mongo = mongo;
        this.cache = cache;
    }
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
    async index(doc, collection, lang = "en") {
        return (0, indexer_1.indexDocument)(doc, collection, this.mongo, lang);
    }
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
    async search(q, options) {
        return (0, searcher_1.search)(q, options, this.mongo, this.cache);
    }
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
    async getSuggestions(partialQuery, options, limit = 5) {
        return (0, searcher_1.getSearchSuggestions)(partialQuery, this.mongo, options, limit);
    }
    /**
     * Analyze a query to see how it will be processed
     * Useful for debugging and understanding search behavior
     *
     * @param query - Search query to analyze
     * @param language - Language for analysis
     * @returns Analysis results with tokens and expansions
     */
    analyzeQuery(query, language = "en") {
        return (0, searcher_1.analyzeQuery)(query, language);
    }
}
exports.SmartSearch = SmartSearch;
// Export types and utilities
__exportStar(require("./types"), exports);
__exportStar(require("./cache/redis"), exports);
__exportStar(require("./storage/mongo"), exports);
var english_1 = require("./language/english");
Object.defineProperty(exports, "tokenizeEn", { enumerable: true, get: function () { return english_1.tokenizeEn; } });
Object.defineProperty(exports, "normalizeEnWord", { enumerable: true, get: function () { return english_1.normalizeEnWord; } });
Object.defineProperty(exports, "isValidShortWord", { enumerable: true, get: function () { return english_1.isValidShortWord; } });
Object.defineProperty(exports, "getStopWords", { enumerable: true, get: function () { return english_1.getStopWords; } });
var arabic_1 = require("./language/arabic");
Object.defineProperty(exports, "tokenizeAr", { enumerable: true, get: function () { return arabic_1.tokenizeAr; } });
Object.defineProperty(exports, "normalizeArWord", { enumerable: true, get: function () { return arabic_1.normalizeArWord; } });
Object.defineProperty(exports, "isArabicStopWord", { enumerable: true, get: function () { return arabic_1.isArabicStopWord; } });
Object.defineProperty(exports, "getArabicStopWords", { enumerable: true, get: function () { return arabic_1.getArabicStopWords; } });
//# sourceMappingURL=index.js.map