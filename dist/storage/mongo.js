"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoIndex = void 0;
class MongoIndex {
    constructor(collection) {
        this.collection = collection;
    }
    async getPostings(term, collectionName) {
        return this.collection.find({ term, collection: collectionName }).toArray();
    }
    async bulkWrite(ops) {
        return this.collection.bulkWrite(ops);
    }
}
exports.MongoIndex = MongoIndex;
//# sourceMappingURL=mongo.js.map