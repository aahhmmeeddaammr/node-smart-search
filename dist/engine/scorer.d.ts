/**
 * Document scoring algorithms
 */
import { IndexedDocument, SearchQuery } from '../types';
export interface ScoringWeights {
    termFrequency: number;
    inverseDocumentFrequency: number;
    phraseMatch: number;
    fieldBoost: number;
    proximity: number;
}
export declare const DEFAULT_WEIGHTS: ScoringWeights;
export declare class Scorer {
    private weights;
    private documentFrequencies;
    private totalDocuments;
    constructor(weights?: ScoringWeights);
    updateDocumentFrequencies(documents: IndexedDocument[]): void;
    calculateTF(tokens: string[], term: string): number;
    calculateIDF(term: string): number;
    calculateTFIDF(tokens: string[], term: string): number;
    scoreDocument(document: IndexedDocument, query: SearchQuery, queryTokens: string[]): number;
    private findPhraseMatches;
    private calculateProximity;
}
//# sourceMappingURL=scorer.d.ts.map