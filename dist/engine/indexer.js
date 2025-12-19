"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexDocument = indexDocument;
const fields_1 = require("../utils/fields");
const english_1 = require("../language/english");
const arabic_1 = require("../language/arabic");
async function indexDocument(doc, collectionName, mongo, language = "en") {
    const fields = (0, fields_1.extractSearchFields)(doc);
    const ops = [];
    for (const { field, value } of fields) {
        const tokens = language === "ar"
            ? (0, arabic_1.tokenizeAr)(value)
            : (0, english_1.tokenizeEn)(value);
        const termMap = {};
        tokens.forEach((term, pos) => {
            if (!termMap[term]) {
                termMap[term] = { tf: 0, positions: [] };
            }
            termMap[term].tf++;
            termMap[term].positions.push(pos);
        });
        for (const term in termMap) {
            ops.push({
                updateOne: {
                    filter: {
                        term,
                        docId: doc._id,
                        field,
                        collection: collectionName
                    },
                    update: {
                        $set: {
                            term,
                            docId: doc._id,
                            field,
                            collection: collectionName,
                            tf: termMap[term].tf,
                            positions: termMap[term].positions
                        }
                    },
                    upsert: true
                }
            });
        }
    }
    if (ops.length > 0) {
        await mongo.bulkWrite(ops);
    }
}
//# sourceMappingURL=indexer.js.map