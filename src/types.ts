/**
 * Search options for configuring search behavior
 */
export interface SearchOptions {
  /** Collection name to search in */
  collection: string;

  /** Language for tokenization and stemming */
  language?: "en" | "ar";

  /** Specific fields to search in (optional) */
  fields?: string[];

  /** Minimum term length to include in search (default: 1) */
  minTermLength?: number;

  /** Enable fuzzy matching for typo tolerance (default: true) */
  enableFuzzy?: boolean;

  /** Maximum edit distance for fuzzy matching (default: 2) */
  fuzzyThreshold?: number;

  /** Fallback to regex/includes search if no exact matches found (default: true) */
  fallbackToIncludes?: boolean;

  /** Enable prefix matching (default: true) */
  enablePrefixMatch?: boolean;

  /** Maximum number of results to return */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Cache provider interface for implementing custom caching
 */
export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
}

/**
 * Posting entry in the search index
 */
export interface Posting {
  term: string;
  docId: any;
  field: string;
  collection: string;
  tf: number;
  positions: number[];
}

/**
 * Index storage interface for custom storage implementations
 */
export interface IndexStorage {
  /** Get postings for an exact term match */
  getPostings(term: string, collection: string): Promise<Posting[]>;

  /** Get postings using regex pattern matching */
  getPostingsByRegex?(pattern: string, collection: string): Promise<Posting[]>;

  /** Get postings by prefix matching */
  getPostingsByPrefix?(prefix: string, collection: string): Promise<Posting[]>;

  /** Get all unique terms in a collection (for fuzzy matching) */
  getAllTerms?(collection: string): Promise<string[]>;

  /** Bulk write operations */
  bulkWrite(ops: any[]): Promise<any>;
}
