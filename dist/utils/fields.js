"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSearchFields = extractSearchFields;
function extractSearchFields(doc) {
    return Object.entries(doc)
        .filter(([k, v]) => k.startsWith("s__") && typeof v === "string")
        .map(([field, value]) => ({ field, value }));
}
//# sourceMappingURL=fields.js.map