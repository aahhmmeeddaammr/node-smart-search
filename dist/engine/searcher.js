"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
exports.getSearchSuggestions = getSearchSuggestions;
exports.analyzeQuery = analyzeQuery;
const phrase_1 = require("./phrase");
const english_1 = require("../language/english");
const arabic_1 = require("../language/arabic");
/**
 * Common English abbreviations and their expansions
 */
const ABBREVIATION_MAP = {
    tech: ["technology", "technical", "technician"],
    app: ["application", "applications"],
    dev: ["developer", "development", "developers"],
    eng: ["engineer", "engineering", "engineers"],
    admin: ["administrator", "administration"],
    info: ["information"],
    doc: ["document", "documentation", "doctor"],
    pic: ["picture", "pictures"],
    msg: ["message", "messages"],
    prof: ["professor", "professional"],
    edu: ["education", "educational"],
    corp: ["corporation", "corporate"],
    dept: ["department"],
    govt: ["government"],
    intl: ["international"],
    max: ["maximum", "maximal"],
    min: ["minimum", "minimal"],
    std: ["standard"],
    temp: ["temperature", "temporary"],
    etc: ["etcetera"],
    approx: ["approximately", "approximate"],
    auto: ["automatic", "automobile", "automated"],
    bio: ["biology", "biological", "biography"],
    eco: ["economy", "economic", "ecology"],
    geo: ["geography", "geological"],
    photo: ["photograph", "photography"],
    sci: ["science", "scientific"],
    stats: ["statistics", "statistical"],
    crypto: ["cryptography", "cryptocurrency", "cryptographic"],
    cyber: ["cybersecurity", "cybernetic"],
    ai: ["artificial intelligence"],
    ml: ["machine learning"],
    db: ["database"],
    api: ["application programming interface"],
    ui: ["user interface"],
    ux: ["user experience"],
};
/**
 * Synonym groups for semantic search
 */
const SYNONYM_GROUPS = [
    ["buy", "purchase", "acquire", "order"],
    ["sell", "sale", "vend"],
    ["big", "large", "huge", "enormous", "massive"],
    ["small", "tiny", "little", "mini"],
    ["fast", "quick", "rapid", "swift", "speedy"],
    ["slow", "sluggish", "gradual"],
    ["good", "great", "excellent", "superb", "outstanding"],
    ["bad", "poor", "terrible", "awful"],
    ["happy", "joyful", "cheerful", "delighted"],
    ["sad", "unhappy", "sorrowful", "depressed"],
    ["begin", "start", "commence", "initiate"],
    ["end", "finish", "conclude", "terminate"],
    ["help", "assist", "aid", "support"],
    ["show", "display", "exhibit", "demonstrate"],
    ["make", "create", "build", "construct", "produce"],
    ["get", "obtain", "receive", "acquire"],
    ["use", "utilize", "employ", "apply"],
    ["work", "job", "employment", "occupation"],
    ["company", "business", "firm", "corporation", "enterprise"],
    ["person", "individual", "human", "people"],
    ["car", "vehicle", "automobile", "auto"],
    ["house", "home", "residence", "dwelling"],
    ["price", "cost", "fee", "charge"],
    ["money", "cash", "currency", "funds"],
    ["computer", "pc", "machine", "device"],
    ["phone", "mobile", "smartphone", "cellphone"],
    ["web", "website", "internet", "online"],
    ["email", "mail", "message"],
    ["important", "significant", "crucial", "vital", "essential"],
    ["new", "recent", "latest", "modern", "fresh"],
    ["old", "ancient", "aged", "vintage"],
    ["easy", "simple", "straightforward", "effortless"],
    ["hard", "difficult", "challenging", "complex"],
    ["improve", "enhance", "boost", "upgrade"],
    ["reduce", "decrease", "lower", "diminish"],
    ["increase", "grow", "expand", "raise"],
];
// Build reverse lookup for synonyms
const SYNONYM_MAP = new Map();
for (const group of SYNONYM_GROUPS) {
    for (const word of group) {
        const normalized = (0, english_1.normalizeEnWord)(word);
        if (!SYNONYM_MAP.has(normalized)) {
            SYNONYM_MAP.set(normalized, new Set());
        }
        group.forEach((synonym) => {
            if (synonym !== word) {
                SYNONYM_MAP.get(normalized).add((0, english_1.normalizeEnWord)(synonym));
            }
        });
    }
}
/**
 * Expand a term to include abbreviations, synonyms, and variations
 */
function expandTerm(term, originalWord) {
    const variations = new Set();
    // Add the normalized form
    const normalized = (0, english_1.normalizeEnWord)(term);
    variations.add(normalized);
    // Check for abbreviation expansions
    const lowerOriginal = originalWord.toLowerCase();
    if (ABBREVIATION_MAP[lowerOriginal]) {
        ABBREVIATION_MAP[lowerOriginal].forEach((expansion) => {
            variations.add((0, english_1.normalizeEnWord)(expansion));
        });
    }
    // Add synonyms
    const synonyms = SYNONYM_MAP.get(normalized);
    if (synonyms) {
        synonyms.forEach((syn) => variations.add(syn));
    }
    return Array.from(variations);
}
/**
 * Calculate edit distance between two strings (Levenshtein distance)
 * Used for fuzzy matching
 */
function editDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
/**
 * Check if term is similar enough for fuzzy matching
 */
function isFuzzyMatch(term, target, maxDistance = 2) {
    if (term === target)
        return true;
    if (Math.abs(term.length - target.length) > maxDistance)
        return false;
    return editDistance(term, target) <= maxDistance;
}
/**
 * Smart search with term expansion, synonyms, and fuzzy matching
 */
async function search(query, options, mongo, cache) {
    const cacheKey = `q:${query}:${options.collection}:v2`;
    // Check cache first
    const cached = await cache?.get(cacheKey);
    if (cached)
        return cached;
    const language = options.language || "en";
    const queryTokens = language === "ar" ? (0, arabic_1.tokenizeAr)(query) : (0, english_1.tokenizeEn)(query);
    if (queryTokens.length === 0) {
        return [];
    }
    const originalQueryWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);
    // Score tracking
    const scores = new Map();
    const docIdMap = new Map();
    const fieldMatches = new Map(); // Track which fields matched per doc
    // Weight configuration
    const WEIGHTS = {
        EXACT_MATCH: 100,
        PHRASE_MATCH: 150,
        SYNONYM_MATCH: 70,
        ABBREVIATION_MATCH: 80,
        PREFIX_MATCH: 50,
        FUZZY_MATCH: 30,
        TERM_FREQUENCY: 1,
    };
    // Process first term (anchor) with expansions
    const anchorToken = queryTokens[0];
    const anchorOriginal = originalQueryWords[0] || anchorToken;
    const anchorExpansions = language === "en" ? expandTerm(anchorToken, anchorOriginal) : [anchorToken];
    console.log(`Anchor "${anchorOriginal}" expanded to:`, anchorExpansions);
    const allAnchorPostings = [];
    // Fetch postings for all anchor variations
    for (const expansion of anchorExpansions) {
        const postings = await mongo.getPostings(expansion, options.collection);
        for (const posting of postings) {
            const docIdStr = posting.docId.toString();
            docIdMap.set(docIdStr, posting.docId);
            // Track field matches
            if (!fieldMatches.has(docIdStr)) {
                fieldMatches.set(docIdStr, new Set());
            }
            fieldMatches.get(docIdStr).add(posting.field);
            // Calculate score based on match type
            let weight = WEIGHTS.TERM_FREQUENCY;
            if (expansion === (0, english_1.normalizeEnWord)(anchorOriginal)) {
                weight = WEIGHTS.EXACT_MATCH;
            }
            else if (ABBREVIATION_MAP[anchorOriginal]?.some((abbr) => (0, english_1.normalizeEnWord)(abbr) === expansion)) {
                weight = WEIGHTS.ABBREVIATION_MATCH;
            }
            else if (SYNONYM_MAP.get(anchorToken)?.has(expansion)) {
                weight = WEIGHTS.SYNONYM_MATCH;
            }
            const score = posting.tf * weight;
            scores.set(docIdStr, (scores.get(docIdStr) || 0) + score);
            allAnchorPostings.push(posting);
        }
    }
    // Process remaining terms
    for (let i = 1; i < queryTokens.length; i++) {
        const token = queryTokens[i];
        const originalWord = originalQueryWords[i] || token;
        const expansions = language === "en" ? expandTerm(token, originalWord) : [token];
        console.log(`Term "${originalWord}" expanded to:`, expansions);
        for (const expansion of expansions) {
            const postings = await mongo.getPostings(expansion, options.collection);
            for (const posting of postings) {
                const docIdStr = posting.docId.toString();
                docIdMap.set(docIdStr, posting.docId);
                if (!fieldMatches.has(docIdStr)) {
                    fieldMatches.set(docIdStr, new Set());
                }
                fieldMatches.get(docIdStr).add(posting.field);
                // Calculate match weight
                let weight = WEIGHTS.TERM_FREQUENCY;
                if (expansion === (0, english_1.normalizeEnWord)(originalWord)) {
                    weight = WEIGHTS.EXACT_MATCH;
                }
                else if (ABBREVIATION_MAP[originalWord]?.some((abbr) => (0, english_1.normalizeEnWord)(abbr) === expansion)) {
                    weight = WEIGHTS.ABBREVIATION_MATCH;
                }
                else if (SYNONYM_MAP.get(token)?.has(expansion)) {
                    weight = WEIGHTS.SYNONYM_MATCH;
                }
                // Check for phrase match with previous term
                if (i === 1) {
                    const anchorPosting = allAnchorPostings.find((p) => p.docId.toString() === docIdStr && p.field === posting.field);
                    if (anchorPosting && (0, phrase_1.phraseMatch)(anchorPosting.positions, posting.positions)) {
                        scores.set(docIdStr, (scores.get(docIdStr) || 0) + WEIGHTS.PHRASE_MATCH);
                    }
                }
                const score = posting.tf * weight;
                scores.set(docIdStr, (scores.get(docIdStr) || 0) + score);
            }
        }
    }
    // Boost documents that match in multiple fields
    for (const [docIdStr, fields] of fieldMatches.entries()) {
        if (fields.size > 1) {
            const boost = fields.size * 10;
            scores.set(docIdStr, (scores.get(docIdStr) || 0) + boost);
        }
    }
    // Sort by score and return document IDs
    const result = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([docIdStr]) => docIdMap.get(docIdStr) || docIdStr);
    // Cache results
    await cache?.set(cacheKey, result, 300); // 5 minutes cache
    return result;
}
/**
 * Helper: Get search suggestions based on partial input
 */
async function getSearchSuggestions(partialQuery, mongo, options, limit = 5) {
    const language = options.language || "en";
    const tokens = language === "ar" ? (0, arabic_1.tokenizeAr)(partialQuery) : (0, english_1.tokenizeEn)(partialQuery);
    if (tokens.length === 0)
        return [];
    const lastToken = tokens[tokens.length - 1];
    // Use regular getPostings and filter for prefix matches
    const allPostings = await mongo.getPostings(lastToken, options.collection);
    // Get unique terms and sort by frequency
    const termFrequency = new Map();
    allPostings.forEach((p) => {
        if (p.term && p.term.startsWith(lastToken)) {
            termFrequency.set(p.term, (termFrequency.get(p.term) || 0) + p.tf);
        }
    });
    return Array.from(termFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([term]) => term);
}
/**
 * Helper: Analyze query and return expansion info
 */
function analyzeQuery(query, language = "en") {
    const tokens = language === "ar" ? (0, arabic_1.tokenizeAr)(query) : (0, english_1.tokenizeEn)(query);
    const originalWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);
    return tokens.map((token, i) => ({
        original: originalWords[i] || token,
        normalized: token,
        expansions: language === "en" ? expandTerm(token, originalWords[i] || token) : [token],
    }));
}
//# sourceMappingURL=searcher.js.map