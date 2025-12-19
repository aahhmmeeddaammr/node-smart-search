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
exports.SmartSearch = void 0;
const indexer_1 = require("./engine/indexer");
const searcher_1 = require("./engine/searcher");
class SmartSearch {
    constructor(mongo, cache) {
        this.mongo = mongo;
        this.cache = cache;
    }
    index(doc, collection, lang = "en") {
        return (0, indexer_1.indexDocument)(doc, collection, this.mongo, lang);
    }
    search(q, options) {
        return (0, searcher_1.search)(q, options, this.mongo, this.cache);
    }
}
exports.SmartSearch = SmartSearch;
__exportStar(require("./types"), exports);
__exportStar(require("./cache/redis"), exports);
__exportStar(require("./storage/mongo"), exports);
//# sourceMappingURL=index.js.map