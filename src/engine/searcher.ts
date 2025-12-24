import { phraseMatch } from "./phrase";
import { SearchOptions, CacheProvider, Posting } from "../types";
import { tokenizeEn, normalizeEnWord, isValidShortWord } from "../language/english";
import { tokenizeAr } from "../language/arabic";

/**
 * Common English abbreviations and their expansions
 */
const ABBREVIATION_MAP: Record<string, string[]> = {
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
const SYNONYM_GROUPS: string[][] = [
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
const SYNONYM_MAP = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const normalized = normalizeEnWord(word);
    if (!SYNONYM_MAP.has(normalized)) {
      SYNONYM_MAP.set(normalized, new Set());
    }
    group.forEach((synonym) => {
      if (synonym !== word) {
        SYNONYM_MAP.get(normalized)!.add(normalizeEnWord(synonym));
      }
    });
  }
}

/**
 * Expand a term to include abbreviations, synonyms, and variations
 */
function expandTerm(term: string, originalWord: string): string[] {
  const variations = new Set<string>();

  // Add the normalized form
  const normalized = normalizeEnWord(term);
  variations.add(normalized);

  // Also add the original term for short words
  if (term.length <= 2) {
    variations.add(term.toLowerCase());
  }

  // Check for abbreviation expansions
  const lowerOriginal = originalWord.toLowerCase();
  if (ABBREVIATION_MAP[lowerOriginal]) {
    ABBREVIATION_MAP[lowerOriginal].forEach((expansion) => {
      variations.add(normalizeEnWord(expansion));
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
function editDistance(a: string, b: string): number {
  const matrix: number[][] = [];

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
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if term is similar enough for fuzzy matching
 */
function isFuzzyMatch(
  term: string,
  target: string,
  maxDistance: number = 2
): boolean {
  if (term === target) return true;
  if (Math.abs(term.length - target.length) > maxDistance) return false;
  return editDistance(term, target) <= maxDistance;
}

/**
 * Find fuzzy matches for a term from all indexed terms
 */
async function findFuzzyMatches(
  term: string,
  mongo: any,
  collectionName: string,
  maxDistance: number = 2
): Promise<string[]> {
  if (!mongo.getAllTerms) {
    return [];
  }

  try {
    const allTerms = await mongo.getAllTerms(collectionName);
    return allTerms.filter((indexedTerm: string) =>
      isFuzzyMatch(term, indexedTerm, maxDistance)
    );
  } catch (e) {
    return [];
  }
}

/**
 * Determine optimal search strategy based on query characteristics
 */
function getSearchStrategy(query: string, tokens: string[]): {
  usePrefix: boolean;
  useRegex: boolean;
  useFuzzy: boolean;
} {
  const queryLength = query.trim().length;
  const hasShortTokens = tokens.some((t) => t.length <= 2);
  const isSingleToken = tokens.length === 1;

  return {
    // Use prefix for short queries (1-2 chars) or single short tokens
    usePrefix: queryLength <= 2 || (isSingleToken && hasShortTokens),
    // Use regex fallback for medium queries when no exact matches
    useRegex: true,
    // Use fuzzy for longer queries to catch typos
    useFuzzy: queryLength >= 3,
  };
}

/**
 * Weight configuration for scoring
 */
const WEIGHTS = {
  EXACT_MATCH: 100,
  PHRASE_MATCH: 150,
  SYNONYM_MATCH: 70,
  ABBREVIATION_MATCH: 80,
  PREFIX_MATCH: 50,
  FUZZY_MATCH: 30,
  REGEX_MATCH: 25,
  TERM_FREQUENCY: 1,
};

/**
 * Smart search with term expansion, synonyms, fuzzy matching, and fallback strategies
 */
export async function search(
  query: string,
  options: SearchOptions,
  mongo: any,
  cache?: CacheProvider
): Promise<any[]> {
  // Apply default options
  const {
    collection: collectionName,
    language = "en",
    enableFuzzy = true,
    fuzzyThreshold = 2,
    fallbackToIncludes = true,
    enablePrefixMatch = true,
    minTermLength = 1,
  } = options;

  const cacheKey = `q:${query}:${collectionName}:v3`;

  // Check cache first
  const cached = await cache?.get<any[]>(cacheKey);
  if (cached) return cached;

  // Tokenize query
  const queryTokens =
    language === "ar"
      ? tokenizeAr(query)
      : tokenizeEn(query, { minLength: minTermLength });

  if (queryTokens.length === 0) {
    // If no tokens but query has content, treat the whole query as a search term
    if (query.trim().length > 0) {
      const trimmedQuery = query.trim().toLowerCase();
      // Try prefix/regex search for very short queries
      if (enablePrefixMatch && mongo.getPostingsByPrefix) {
        const prefixResults = await mongo.getPostingsByPrefix(
          trimmedQuery,
          collectionName
        );
        if (prefixResults.length > 0) {
          const docIds = [...new Set(prefixResults.map((p: Posting) => p.docId))];
          await cache?.set(cacheKey, docIds, 300);
          return docIds;
        }
      }
    }
    return [];
  }

  const originalQueryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Determine search strategy
  const strategy = getSearchStrategy(query, queryTokens);

  // Score tracking
  const scores: Map<string, number> = new Map();
  const docIdMap: Map<string, any> = new Map();
  const fieldMatches: Map<string, Set<string>> = new Map();

  /**
   * Process postings and update scores
   */
  function processPostings(
    postings: Posting[],
    weight: number,
    token: string,
    originalWord: string
  ) {
    for (const posting of postings) {
      const docIdStr = posting.docId.toString();
      docIdMap.set(docIdStr, posting.docId);

      if (!fieldMatches.has(docIdStr)) {
        fieldMatches.set(docIdStr, new Set());
      }
      fieldMatches.get(docIdStr)!.add(posting.field);

      const score = posting.tf * weight;
      scores.set(docIdStr, (scores.get(docIdStr) || 0) + score);
    }
  }

  /**
   * Search for a single token with all strategies
   */
  async function searchToken(
    token: string,
    originalWord: string,
    isAnchor: boolean
  ): Promise<Posting[]> {
    const allPostings: Posting[] = [];
    let foundExact = false;

    // 1. Try exact match with expansions
    const expansions =
      language === "en" ? expandTerm(token, originalWord) : [token];

    for (const expansion of expansions) {
      const postings = await mongo.getPostings(expansion, collectionName);
      if (postings.length > 0) {
        foundExact = true;
        let weight = WEIGHTS.TERM_FREQUENCY;

        // Determine weight based on match type
        if (expansion === normalizeEnWord(originalWord) || expansion === originalWord.toLowerCase()) {
          weight = WEIGHTS.EXACT_MATCH;
        } else if (
          ABBREVIATION_MAP[originalWord.toLowerCase()]?.some(
            (abbr) => normalizeEnWord(abbr) === expansion
          )
        ) {
          weight = WEIGHTS.ABBREVIATION_MATCH;
        } else if (SYNONYM_MAP.get(token)?.has(expansion)) {
          weight = WEIGHTS.SYNONYM_MATCH;
        }

        processPostings(postings, weight, token, originalWord);
        allPostings.push(...postings);
      }
    }

    // 2. Try prefix match for short queries
    if (
      !foundExact &&
      enablePrefixMatch &&
      strategy.usePrefix &&
      mongo.getPostingsByPrefix
    ) {
      const prefixPostings = await mongo.getPostingsByPrefix(
        originalWord.toLowerCase(),
        collectionName
      );
      if (prefixPostings.length > 0) {
        foundExact = true;
        processPostings(
          prefixPostings,
          WEIGHTS.PREFIX_MATCH,
          token,
          originalWord
        );
        allPostings.push(...prefixPostings);
      }
    }

    // 3. Try fuzzy matching
    if (!foundExact && enableFuzzy && strategy.useFuzzy) {
      const fuzzyMatches = await findFuzzyMatches(
        token,
        mongo,
        collectionName,
        fuzzyThreshold
      );

      for (const fuzzyTerm of fuzzyMatches) {
        const fuzzyPostings = await mongo.getPostings(fuzzyTerm, collectionName);
        if (fuzzyPostings.length > 0) {
          foundExact = true;
          processPostings(
            fuzzyPostings,
            WEIGHTS.FUZZY_MATCH,
            token,
            originalWord
          );
          allPostings.push(...fuzzyPostings);
        }
      }
    }

    // 4. Fallback to regex/includes matching
    if (!foundExact && fallbackToIncludes && mongo.getPostingsByRegex) {
      const regexPostings = await mongo.getPostingsByRegex(
        originalWord.toLowerCase(),
        collectionName
      );
      if (regexPostings.length > 0) {
        processPostings(
          regexPostings,
          WEIGHTS.REGEX_MATCH,
          token,
          originalWord
        );
        allPostings.push(...regexPostings);
      }
    }

    return allPostings;
  }

  // Process all tokens
  const allAnchorPostings = await searchToken(
    queryTokens[0],
    originalQueryWords[0] || queryTokens[0],
    true
  );

  // Process remaining terms
  for (let i = 1; i < queryTokens.length; i++) {
    const token = queryTokens[i];
    const originalWord = originalQueryWords[i] || token;

    const tokenPostings = await searchToken(token, originalWord, false);

    // Check for phrase match with anchor
    const anchorPosting = allAnchorPostings.find(
      (p: Posting) =>
        tokenPostings.some(
          (tp: Posting) =>
            p.docId.toString() === tp.docId.toString() && p.field === tp.field
        )
    );

    if (anchorPosting) {
      const matchingPosting = tokenPostings.find(
        (tp: Posting) =>
          tp.docId.toString() === anchorPosting.docId.toString() &&
          tp.field === anchorPosting.field
      );

      if (
        matchingPosting &&
        phraseMatch(anchorPosting.positions, matchingPosting.positions)
      ) {
        const docIdStr = anchorPosting.docId.toString();
        scores.set(
          docIdStr,
          (scores.get(docIdStr) || 0) + WEIGHTS.PHRASE_MATCH
        );
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
  let result = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([docIdStr]) => docIdMap.get(docIdStr) || docIdStr);

  // Apply limit and offset if specified
  if (options.offset !== undefined) {
    result = result.slice(options.offset);
  }
  if (options.limit !== undefined) {
    result = result.slice(0, options.limit);
  }

  // Cache results
  await cache?.set(cacheKey, result, 300); // 5 minutes cache

  return result;
}

/**
 * Helper: Get search suggestions based on partial input
 */
export async function getSearchSuggestions(
  partialQuery: string,
  mongo: any,
  options: SearchOptions,
  limit: number = 5
): Promise<string[]> {
  const language = options.language || "en";
  const tokens =
    language === "ar" ? tokenizeAr(partialQuery) : tokenizeEn(partialQuery);

  if (tokens.length === 0) {
    // For very short queries, try prefix search
    if (partialQuery.trim().length > 0 && mongo.getPostingsByPrefix) {
      const postings = await mongo.getPostingsByPrefix(
        partialQuery.trim().toLowerCase(),
        options.collection
      );
      const termFrequency = new Map<string, number>();
      postings.forEach((p: Posting) => {
        if (p.term) {
          termFrequency.set(p.term, (termFrequency.get(p.term) || 0) + p.tf);
        }
      });
      return Array.from(termFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([term]) => term);
    }
    return [];
  }

  const lastToken = tokens[tokens.length - 1];

  // Use prefix search if available
  if (mongo.getPostingsByPrefix) {
    const postings = await mongo.getPostingsByPrefix(
      lastToken,
      options.collection
    );
    const termFrequency = new Map<string, number>();
    postings.forEach((p: Posting) => {
      if (p.term) {
        termFrequency.set(p.term, (termFrequency.get(p.term) || 0) + p.tf);
      }
    });
    return Array.from(termFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term]) => term);
  }

  // Fallback to regular getPostings
  const allPostings = await mongo.getPostings(lastToken, options.collection);
  const termFrequency = new Map<string, number>();
  allPostings.forEach((p: any) => {
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
export function analyzeQuery(
  query: string,
  language: string = "en"
): {
  original: string;
  normalized: string;
  expansions: string[];
}[] {
  const tokens =
    language === "ar" ? tokenizeAr(query) : tokenizeEn(query);
  const originalWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  return tokens.map((token, i) => ({
    original: originalWords[i] || token,
    normalized: token,
    expansions:
      language === "en"
        ? expandTerm(token, originalWords[i] || token)
        : [token],
  }));
}

// Export utility functions for external use
export { editDistance, isFuzzyMatch };
