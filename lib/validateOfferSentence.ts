export const OFFER_SENTENCE_MAX_LENGTH = 500;

export interface OfferSentenceValidation {
  valid: boolean;
  reason?: string;
}

// Guards the offer sentence before it reaches the LLM grader: an empty
// sentence has nothing to grade, and an oversized one is either abuse
// (burning OpenAI spend on a free endpoint) or a pasted document rather
// than the required one-sentence pitch.
export function validateOfferSentence(raw: string): OfferSentenceValidation {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { valid: false, reason: "Write one sentence before submitting." };
  }

  if (trimmed.length > OFFER_SENTENCE_MAX_LENGTH) {
    return {
      valid: false,
      reason: `Keep it to one sentence — ${OFFER_SENTENCE_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { valid: true };
}
