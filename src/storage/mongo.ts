import { IndexStorage, Posting } from "../types";

/**
 * MongoDB Index Storage implementation
 * Works with both native MongoDB driver and Mongoose models
 */
export class MongoIndex implements IndexStorage {
  private collection: any;
  private isMongoose: boolean;

  /**
   * Create a new MongoIndex instance
   * @param collection - MongoDB collection or Mongoose model
   */
  constructor(collection: any) {
    this.collection = collection;
    // Detect if this is a Mongoose model by checking for modelName property
    this.isMongoose = !!(collection.modelName || collection.schema);
  }

  /**
   * Execute a find query - handles both MongoDB driver and Mongoose
   */
  private async executeFind(query: any): Promise<Posting[]> {
    const cursor = this.collection.find(query);

    // Mongoose models return a Query that needs exec() or can be awaited directly
    // Native MongoDB driver returns a cursor that needs toArray()
    if (this.isMongoose) {
      // Mongoose - use lean() for better performance
      return cursor.lean().exec();
    } else {
      // Native MongoDB driver
      return cursor.toArray();
    }
  }

  /**
   * Get postings for exact term match
   */
  async getPostings(term: string, collectionName: string): Promise<Posting[]> {
    return this.executeFind({ term, collection: collectionName });
  }

  /**
   * Get postings using regex pattern matching
   * Useful for substring/includes matching
   */
  async getPostingsByRegex(
    pattern: string,
    collectionName: string
  ): Promise<Posting[]> {
    // Escape special regex characters for safe matching
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.executeFind({
      term: { $regex: escapedPattern, $options: "i" },
      collection: collectionName,
    });
  }

  /**
   * Get postings by prefix matching
   * Useful for autocomplete and short queries
   */
  async getPostingsByPrefix(
    prefix: string,
    collectionName: string
  ): Promise<Posting[]> {
    // Escape special regex characters
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.executeFind({
      term: { $regex: `^${escapedPrefix}`, $options: "i" },
      collection: collectionName,
    });
  }

  /**
   * Get all unique terms in a collection
   * Used for fuzzy matching
   */
  async getAllTerms(collectionName: string): Promise<string[]> {
    if (this.isMongoose) {
      return this.collection.distinct("term", { collection: collectionName });
    } else {
      return this.collection.distinct("term", { collection: collectionName });
    }
  }

  /**
   * Bulk write operations for indexing
   */
  async bulkWrite(ops: any[]): Promise<any> {
    if (ops.length === 0) return { ok: 1 };
    return this.collection.bulkWrite(ops);
  }

  /**
   * Delete all postings for a document
   */
  async deleteDocument(
    docId: any,
    collectionName: string
  ): Promise<{ deletedCount: number }> {
    const result = await this.collection.deleteMany({
      docId,
      collection: collectionName,
    });
    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Create recommended indexes for optimal search performance
   */
  async createIndexes(): Promise<void> {
    const indexes = [
      { key: { term: 1, collection: 1 }, name: "term_collection_idx" },
      {
        key: { docId: 1, collection: 1, field: 1 },
        name: "doc_collection_field_idx",
      },
      {
        key: { term: 1, docId: 1, field: 1, collection: 1 },
        name: "unique_posting_idx",
        unique: true,
      },
    ];

    if (this.isMongoose) {
      // Mongoose - use schema index or ensureIndexes
      for (const idx of indexes) {
        try {
          await this.collection.collection.createIndex(idx.key, {
            name: idx.name,
            unique: idx.unique,
          });
        } catch (e) {
          // Index might already exist
        }
      }
    } else {
      // Native MongoDB driver
      for (const idx of indexes) {
        try {
          await this.collection.createIndex(idx.key, {
            name: idx.name,
            unique: idx.unique,
          });
        } catch (e) {
          // Index might already exist
        }
      }
    }
  }
}
