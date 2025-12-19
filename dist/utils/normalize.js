"use strict";
/**
 * Text normalization utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWhitespace = normalizeWhitespace;
exports.removePunctuation = removePunctuation;
exports.toLowerCase = toLowerCase;
exports.normalizeText = normalizeText;
exports.removeDiacritics = removeDiacritics;
exports.extractWords = extractWords;
function normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
}
function removePunctuation(text) {
    return text.replace(/[^\p{L}\p{N}\s]/gu, ' ');
}
function toLowerCase(text) {
    return text.toLowerCase();
}
function normalizeText(text) {
    return normalizeWhitespace(removePunctuation(toLowerCase(text)));
}
function removeDiacritics(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function extractWords(text) {
    return normalizeText(text)
        .split(/\s+/)
        .filter(word => word.length > 0);
}
//# sourceMappingURL=normalize.js.map