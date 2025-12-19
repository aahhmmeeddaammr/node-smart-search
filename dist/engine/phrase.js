"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phraseMatch = phraseMatch;
function phraseMatch(a, b) {
    const set = new Set(b);
    return a.some(p => set.has(p + 1));
}
//# sourceMappingURL=phrase.js.map