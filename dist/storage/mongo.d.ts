export declare class MongoIndex {
    private collection;
    constructor(collection: any);
    getPostings(term: string, collectionName: string): Promise<any>;
    bulkWrite(ops: any[]): Promise<any>;
}
//# sourceMappingURL=mongo.d.ts.map