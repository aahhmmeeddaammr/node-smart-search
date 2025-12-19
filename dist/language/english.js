"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEnWord = normalizeEnWord;
exports.tokenizeEn = tokenizeEn;
// @ts-ignore
const natural_1 = __importDefault(require("natural"));
const stemmer = natural_1.default.PorterStemmer;
/**
 * Common English stop words to optionally filter out
 */
const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
]);
/**
 * Irregular plural forms mapping
 */
const IRREGULAR_PLURALS = {
    children: "child",
    men: "man",
    women: "woman",
    people: "person",
    feet: "foot",
    teeth: "tooth",
    geese: "goose",
    mice: "mouse",
    criteria: "criterion",
    phenomena: "phenomenon",
    analyses: "analysis",
    theses: "thesis",
    data: "datum",
};
/**
 * Common verb irregularities
 */
const IRREGULAR_VERBS = {
    went: "go",
    gone: "go",
    bought: "buy",
    thought: "think",
    taught: "teach",
    caught: "catch",
    fought: "fight",
    brought: "bring",
    ran: "run",
    began: "begin",
    sang: "sing",
    rang: "ring",
    ate: "eat",
    gave: "give",
    took: "take",
    came: "come",
    saw: "see",
    wrote: "write",
    spoke: "speak",
    drove: "drive",
    rode: "ride",
    wore: "wear",
    knew: "know",
    grew: "grow",
    threw: "throw",
    flew: "fly",
};
/**
 * Words that should not be stemmed
 */
const NO_STEM_WORDS = new Set(["news", "species", "series", "means", "headquarters"]);
/**
 * Normalize a single English word to its canonical form
 * Handles: plurals, verb conjugations, comparatives, superlatives, gerunds, adverbs
 *
 * Examples:
 * - latest → late
 * - gaming → game
 * - running → run
 * - better → good (via stemmer)
 */
function normalizeEnWord(word) {
    const original = word.toLowerCase().trim();
    if (!original)
        return "";
    // Remove punctuation but keep internal apostrophes temporarily
    let cleaned = original.replace(/[^a-z0-9']/g, "");
    // Handle contractions (don't → do not, can't → can not)
    cleaned = cleaned
        .replace(/n't$/, " not")
        .replace(/'s$/, "") // possessive
        .replace(/'re$/, " are")
        .replace(/'ve$/, " have")
        .replace(/'ll$/, " will")
        .replace(/'d$/, " would")
        .replace(/'m$/, " am");
    // Remove remaining apostrophes
    cleaned = cleaned.replace(/'/g, "");
    if (cleaned.length <= 2)
        return cleaned;
    // Check if it's a word that shouldn't be stemmed
    if (NO_STEM_WORDS.has(cleaned))
        return cleaned;
    // Handle irregular plurals
    if (IRREGULAR_PLURALS[cleaned]) {
        return stemmer.stem(IRREGULAR_PLURALS[cleaned]);
    }
    // Handle irregular verbs
    if (IRREGULAR_VERBS[cleaned]) {
        return stemmer.stem(IRREGULAR_VERBS[cleaned]);
    }
    let base = cleaned;
    // Morphological normalization rules (order matters!)
    // 1. Superlatives (-est): latest → late, biggest → big
    if (base.endsWith("iest") && base.length > 5) {
        base = base.slice(0, -4) + "y"; // happiest → happy
    }
    else if (base.endsWith("est") && base.length > 4) {
        // Handle doubled consonants: biggest → big
        if (base.length > 5 && base[base.length - 4] === base[base.length - 5]) {
            base = base.slice(0, -4);
        }
        else {
            base = base.slice(0, -3);
        }
    }
    // 2. Comparatives (-er): later → late, bigger → big
    else if (base.endsWith("ier") && base.length > 4) {
        base = base.slice(0, -3) + "y"; // happier → happy
    }
    else if (base.endsWith("er") && base.length > 3) {
        // Handle doubled consonants: bigger → big
        if (base.length > 4 && base[base.length - 3] === base[base.length - 4]) {
            base = base.slice(0, -3);
        }
        else if (!["after", "under", "over", "other", "never"].includes(base)) {
            base = base.slice(0, -2);
        }
    }
    // 3. Adverbs (-ly): quickly → quick, happily → happy
    else if (base.endsWith("ily") && base.length > 4) {
        base = base.slice(0, -3) + "y"; // happily → happy
    }
    else if (base.endsWith("ly") && base.length > 3) {
        if (!["only", "early", "daily", "holy", "ugly"].includes(base)) {
            base = base.slice(0, -2);
        }
    }
    // 4. Gerunds and present participles (-ing): gaming → game, running → run
    else if (base.endsWith("ing") && base.length > 4) {
        // Try removing -ing first
        let candidate = base.slice(0, -3);
        // Handle doubled consonants: running → run, swimming → swim
        if (candidate.length > 2 &&
            candidate[candidate.length - 1] === candidate[candidate.length - 2] &&
            !"aeiou".includes(candidate[candidate.length - 1])) {
            candidate = candidate.slice(0, -1);
        }
        // Add 'e' if needed: gaming → game, loving → love
        // Check if removing 'ing' creates an impossible consonant cluster
        const endsWithCVC = candidate.length >= 3 &&
            !"aeiou".includes(candidate[candidate.length - 1]) &&
            "aeiou".includes(candidate[candidate.length - 2]) &&
            !"aeiou".includes(candidate[candidate.length - 3]);
        if (endsWithCVC && !["hav", "giv", "mak"].includes(candidate)) {
            base = candidate + "e";
        }
        else {
            base = candidate;
        }
    }
    // 5. Past tense and past participles (-ed): played → play, stopped → stop
    else if (base.endsWith("ied") && base.length > 4) {
        base = base.slice(0, -3) + "y"; // tried → try
    }
    else if (base.endsWith("ed") && base.length > 3) {
        let candidate = base.slice(0, -2);
        // Handle doubled consonants: stopped → stop
        if (candidate.length > 2 &&
            candidate[candidate.length - 1] === candidate[candidate.length - 2] &&
            !"aeiou".includes(candidate[candidate.length - 1])) {
            candidate = candidate.slice(0, -1);
        }
        // Add 'e' if needed: loved → love
        const endsWithCVC = candidate.length >= 3 &&
            !"aeiou".includes(candidate[candidate.length - 1]) &&
            "aeiou".includes(candidate[candidate.length - 2]) &&
            !"aeiou".includes(candidate[candidate.length - 3]);
        if (endsWithCVC) {
            base = candidate + "e";
        }
        else {
            base = candidate;
        }
    }
    // 6. Plurals (-s, -es): games → game, boxes → box
    else if (base.endsWith("ies") && base.length > 4) {
        base = base.slice(0, -3) + "y"; // companies → company
    }
    else if (base.endsWith("ves") && base.length > 4) {
        base = base.slice(0, -3) + "f"; // lives → life
    }
    else if (base.endsWith("ses") && base.length > 4) {
        base = base.slice(0, -2); // boxes → box, classes → class
    }
    else if (base.endsWith("xes") && base.length > 4) {
        base = base.slice(0, -2); // foxes → fox
    }
    else if (base.endsWith("zes") && base.length > 4) {
        base = base.slice(0, -2); // quizzes → quiz
    }
    else if (base.endsWith("ches") && base.length > 5) {
        base = base.slice(0, -2); // churches → church
    }
    else if (base.endsWith("shes") && base.length > 5) {
        base = base.slice(0, -2); // wishes → wish
    }
    else if (base.endsWith("s") && base.length > 3 && !base.endsWith("ss") && !base.endsWith("us")) {
        base = base.slice(0, -1); // games → game
    }
    // Apply Porter Stemmer for final normalization
    const stemmed = stemmer.stem(base);
    return stemmed;
}
/**
 * Tokenize text into normalized canonical forms
 *
 * @param text - Input text to tokenize
 * @param options - Configuration options
 * @returns Array of normalized tokens
 */
function tokenizeEn(text, options = {}) {
    const { minLength = 2, removeStopWords = false, preserveNumbers = true } = options;
    // Split on whitespace and punctuation, but preserve numbers if needed
    const pattern = preserveNumbers ? /[^\w\s]/g : /[^a-z\s]/gi;
    const tokens = text
        .toLowerCase()
        .replace(pattern, " ")
        .split(/\s+/)
        .filter((token) => token.length > 0);
    const normalized = tokens
        .map((token) => {
        // Keep numbers as-is if preserveNumbers is true
        if (preserveNumbers && /^\d+$/.test(token)) {
            return token;
        }
        return normalizeEnWord(token);
    })
        .filter((token) => {
        if (token.length < minLength)
            return false;
        if (removeStopWords && STOP_WORDS.has(token))
            return false;
        return true;
    });
    // Remove duplicates while preserving order
    return [...new Set(normalized)];
}
//# sourceMappingURL=english.js.map