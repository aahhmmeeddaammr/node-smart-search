export class MongoIndex {
  constructor(private collection: any) {}

  async getPostings(term: string, collectionName: string) {
    return this.collection.find({ term, collection: collectionName }).toArray();
  }

  async bulkWrite(ops: any[]) {
    return this.collection.bulkWrite(ops);
  }
}
