import { IndexStorage, Posting } from "../types";
/**
 * MongoDB Index Storage implementation
 * Works with both native MongoDB driver and Mongoose models
 */
export declare class MongoIndex implements IndexStorage {
    private collection;
    private isMongoose;
    /**
     * Create a new MongoIndex instance
     * @param collection - MongoDB collection or Mongoose model
     */
    constructor(collection: any);
    /**
     * Execute a find query - handles both MongoDB driver and Mongoose
     */
    private executeFind;
    /**
     * Get postings for exact term match
     */
    getPostings(term: string, collectionName: string): Promise<Posting[]>;
    /**
     * Get postings using regex pattern matching
     * Useful for substring/includes matching
     */
    getPostingsByRegex(pattern: string, collectionName: string): Promise<Posting[]>;
    /**
     * Get postings by prefix matching
     * Useful for autocomplete and short queries
     */
    getPostingsByPrefix(prefix: string, collectionName: string): Promise<Posting[]>;
    /**
     * Get all unique terms in a collection
     * Used for fuzzy matching
     */
    getAllTerms(collectionName: string): Promise<string[]>;
    /**
     * Bulk write operations for indexing
     */
    bulkWrite(ops: any[]): Promise<any>;
    /**
     * Delete all postings for a document
     */
    deleteDocument(docId: any, collectionName: string): Promise<{
        deletedCount: number;
    }>;
    /**
     * Create recommended indexes for optimal search performance
     */
    createIndexes(): Promise<void>;
}
//# sourceMappingURL=mongo.d.ts.map