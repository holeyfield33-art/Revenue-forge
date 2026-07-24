import {
  OFFER_SENTENCE_MAX_LENGTH,
  validateOfferSentence,
} from "./validateOfferSentence";

describe("validateOfferSentence", () => {
  it("rejects an empty sentence", () => {
    expect(validateOfferSentence("").valid).toBe(false);
  });

  it("rejects a whitespace-only sentence", () => {
    expect(validateOfferSentence("   \n\t  ").valid).toBe(false);
  });

  it("accepts a normal one-sentence offer", () => {
    const result = validateOfferSentence(
      "I help B2B SaaS founders launch faster with a Next.js boilerplate.",
    );
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("accepts a sentence exactly at the max length", () => {
    const sentence = "a".repeat(OFFER_SENTENCE_MAX_LENGTH);
    expect(validateOfferSentence(sentence).valid).toBe(true);
  });

  it("rejects a sentence one character over the max length", () => {
    const sentence = "a".repeat(OFFER_SENTENCE_MAX_LENGTH + 1);
    const result = validateOfferSentence(sentence);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/500/);
  });

  it("trims surrounding whitespace before measuring length", () => {
    const sentence = `  ${"a".repeat(OFFER_SENTENCE_MAX_LENGTH)}  `;
    expect(validateOfferSentence(sentence).valid).toBe(true);
  });
});
