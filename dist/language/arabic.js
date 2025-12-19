"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeArWord = normalizeArWord;
exports.tokenizeAr = tokenizeAr;
function normalizeArWord(word) {
    return word
        .replace(/[^\u0600-\u06FF]/g, "")
        .replace(/^(ال|و|ب|ك|ل)/, "") // prefixes
        .replace(/(ات|ون|ين|ة|ه)$/g, "") // suffixes
        .trim();
}
function tokenizeAr(text) {
    return text
        .split(/\s+/)
        .map(normalizeArWord)
        .filter(w => w.length > 2);
}
//# sourceMappingURL=arabic.js.map