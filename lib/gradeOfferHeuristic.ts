// Grades an offer sentence with the same rubric the OpenAI system prompt
// uses (Buyer 33 / Product 33 / Offer 34, buzzwords docked, multiple
// sentences docked 50) when no OPENAI_API_KEY is configured.
//
// This replaces a `Math.random()` fallback that returned a score between
// 70 and 95 regardless of what was typed — a ruthless-grader pitch that
// was, without a paid API key, a coin flip. This scorer is deterministic:
// the same sentence always produces the same score and the same
// feedback, and every point is traceable to something the rubric
// actually asks for.

export interface HeuristicGradeResult {
  score: number;
  feedback: string;
}

const BUYER_MAX = 33;
const PRODUCT_MAX = 33;
const OFFER_MAX = 34;

const VAGUE_BUYER_TERMS =
  /\b(businesses?|people|everyone|anyone|companies|organizations?|individuals?|clients?|customers?|folks|users?)\b/i;

const SPECIFIC_BUYER_TERMS =
  /\b(b2b|b2c|saas|founders?|developers?|devs?|agenc(?:y|ies)|freelanc\w*|startups?|marketers?|creators?|coaches?|consultants?|e-?commerce|shopify|realtors?|landlords?|dentists?|contractors?|solo|indie|small[- ]business\w*|store owners?|restaurant owners?|ceos?|hr managers?|recruiters?|accountants?|lawyers?|photographers?|authors?|bloggers?|podcasters?|creators?|newsletter writers?|coaches?)\b/gi;

// No `g` flag: this is only ever used with `.test()`, and a global regex's
// `lastIndex` persists across calls on the same object — with `g` this
// silently alternated true/false on repeated calls with the same input.
const CONCRETE_PRODUCT_TERMS =
  /\b(boilerplate|template|plugin|extension|app|application|tool|widget|script|bot|dashboard|api|platform|course|guide|checklist|calculator|newsletter|community|audit|framework|library|sdk|cli|spreadsheet|workflow|automation|integration|chrome extension|notion template|shopify app)\b/i;

const BUZZWORDS =
  /\b(solution|innovative|cutting-edge|revolutionary|game-changing|next-level|best-in-class|world-class|seamless|synerg\w*|leverage|disrupt\w*|holistic|robust|scalable|state-of-the-art|turnkey|paradigm)\b/gi;

const MEASURABLE_OUTCOME =
  /\d+\s*(hours?|hrs?|days?|weeks?|months?|minutes?|mins?|%|percent|x\b|\$|dollars?|k\b|customers?|leads?|signups?|users?)/i;

const STRONG_OUTCOME_LANGUAGE =
  /\b(saves?|guarantee[sd]?|without|increases?|reduces?|cuts?|doubles?|triples?|in \d+|by \d+)\b/i;

const VAGUE_OUTCOME_VERBS =
  /\b(helps?|improves?|grows?|boosts?|enhances?|streamlines?|empowers?)\b/i;

function countExtraSentences(trimmed: string): number {
  // Strip the one trailing terminator every sentence is expected to end
  // with, then look for another terminator followed by whitespace and a
  // new word — that's a second sentence. Requiring the trailing space
  // means abbreviations like "Next.js" (no space after the dot) never
  // false-positive.
  const body = trimmed.replace(/[.!?]+\s*$/, "");
  const matches = body.match(/[.!?]+(?=\s+[A-Za-z0-9])/g);
  return matches ? matches.length : 0;
}

function scoreBuyer(sentence: string): { score: number; weak: boolean } {
  const specificHits = sentence.match(SPECIFIC_BUYER_TERMS)?.length ?? 0;
  const isVague = VAGUE_BUYER_TERMS.test(sentence);

  let score = 14; // neutral baseline: no signal either way
  if (specificHits >= 2) score = BUYER_MAX;
  else if (specificHits === 1) score = 24;
  else if (isVague) score = 4;

  return { score, weak: score < 20 };
}

function scoreProduct(sentence: string): { score: number; weak: boolean } {
  const hasConcreteNoun = CONCRETE_PRODUCT_TERMS.test(sentence);
  const buzzwordHits = sentence.match(BUZZWORDS)?.length ?? 0;

  let score = 14;
  if (hasConcreteNoun) score += 15;
  score -= buzzwordHits * 8;
  score = Math.max(0, Math.min(PRODUCT_MAX, score));

  return { score, weak: score < 20 };
}

function scoreOffer(sentence: string): { score: number; weak: boolean } {
  const hasMeasurable = MEASURABLE_OUTCOME.test(sentence);
  const hasStrongLanguage = STRONG_OUTCOME_LANGUAGE.test(sentence);
  const hasVagueVerb = VAGUE_OUTCOME_VERBS.test(sentence);

  let score = 14;
  if (hasMeasurable) score += 14;
  if (hasStrongLanguage) score += 6;
  if (hasVagueVerb && !hasMeasurable) score -= 10;
  score = Math.max(0, Math.min(OFFER_MAX, score));

  return { score, weak: score < 20 };
}

export function heuristicGradeOffer(rawSentence: string): HeuristicGradeResult {
  const sentence = rawSentence.trim();

  if (sentence.length < 40) {
    return {
      score: Math.min(30, sentence.length),
      feedback: "Too short to name a buyer, product, and offer. Try again.",
    };
  }

  const buyer = scoreBuyer(sentence);
  const product = scoreProduct(sentence);
  const offer = scoreOffer(sentence);
  const extraSentences = countExtraSentences(sentence);

  let score = buyer.score + product.score + offer.score;
  if (extraSentences > 0) score -= 50;
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 85) {
    return { score, feedback: "Clear to proceed" };
  }

  if (extraSentences > 0) {
    return {
      score,
      feedback: "One sentence only — that read as more than one.",
    };
  }
  if (buyer.weak) {
    return {
      score,
      feedback: "Vague buyer. Name a specific niche, not a generic catch-all.",
    };
  }
  if (product.weak) {
    return {
      score,
      feedback: 'Vague product. Name the concrete mechanism, not a "solution."',
    };
  }
  if (offer.weak) {
    return {
      score,
      feedback:
        "Vague offer. Give a measurable outcome — a number, a timeframe, a guarantee.",
    };
  }

  return {
    score,
    feedback: "Tighten the buyer, product, and offer into one sharp sentence.",
  };
}
