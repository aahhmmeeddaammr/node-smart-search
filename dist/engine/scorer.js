"use strict";
/**
 * Document scoring algorithms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scorer = exports.DEFAULT_WEIGHTS = void 0;
exports.DEFAULT_WEIGHTS = {
    termFrequency: 1.0,
    inverseDocumentFrequency: 1.0,
    phraseMatch: 2.0,
    fieldBoost: 1.5,
    proximity: 0.5
};
class Scorer {
    constructor(weights = exports.DEFAULT_WEIGHTS) {
        this.weights = weights;
        this.documentFrequencies = new Map();
        this.totalDocuments = 0;
    }
    updateDocumentFrequencies(documents) {
        this.totalDocuments = documents.length;
        this.documentFrequencies.clear();
        for (const doc of documents) {
            const uniqueTokens = new Set(doc.tokens);
            for (const token of uniqueTokens) {
                this.documentFrequencies.set(token, (this.documentFrequencies.get(token) || 0) + 1);
            }
        }
    }
    calculateTF(tokens, term) {
        const count = tokens.filter(t => t === term).length;
        return count / tokens.length;
    }
    calculateIDF(term) {
        const df = this.documentFrequencies.get(term) || 1;
        return Math.log(this.totalDocuments / df);
    }
    calculateTFIDF(tokens, term) {
        const tf = this.calculateTF(tokens, term);
        const idf = this.calculateIDF(term);
        return tf * idf * this.weights.termFrequency * this.weights.inverseDocumentFrequency;
    }
    scoreDocument(document, query, queryTokens) {
        let score = 0;
        // Term frequency and IDF scoring
        for (const queryToken of queryTokens) {
            const tfidf = this.calculateTFIDF(document.tokens, queryToken);
            score += tfidf;
        }
        // Phrase matching boost
        const phraseMatches = this.findPhraseMatches(document.tokens, query.query);
        if (phraseMatches > 0) {
            score += phraseMatches * this.weights.phraseMatch;
        }
        // Field boosting
        if (query.fields && document.fields) {
            for (const field of query.fields) {
                if (field in document.fields) {
                    score += this.weights.fieldBoost;
                }
            }
        }
        // Proximity scoring
        const proximityScore = this.calculateProximity(document.tokens, queryTokens);
        score += proximityScore * this.weights.proximity;
        return score;
    }
    findPhraseMatches(tokens, query) {
        const queryLower = query.toLowerCase();
        const text = tokens.join(' ').toLowerCase();
        // Count phrase occurrences
        let count = 0;
        let index = text.indexOf(queryLower);
        while (index !== -1) {
            count++;
            index = text.indexOf(queryLower, index + 1);
        }
        return count;
    }
    calculateProximity(tokens, queryTokens) {
        if (queryTokens.length < 2) {
            return 0;
        }
        let minDistance = Infinity;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === queryTokens[0]) {
                let distance = 0;
                let found = true;
                let tokenIndex = i + 1;
                for (let j = 1; j < queryTokens.length && tokenIndex < tokens.length; j++) {
                    while (tokenIndex < tokens.length && tokens[tokenIndex] !== queryTokens[j]) {
                        tokenIndex++;
                        distance++;
                    }
                    if (tokenIndex >= tokens.length) {
                        found = false;
                        break;
                    }
                    tokenIndex++;
                }
                if (found && distance < minDistance) {
                    minDistance = distance;
                }
            }
        }
        if (minDistance === Infinity) {
            return 0;
        }
        // Inverse distance scoring (closer = higher score)
        return 1 / (1 + minDistance);
    }
}
exports.Scorer = Scorer;
//# sourceMappingURL=scorer.js.map