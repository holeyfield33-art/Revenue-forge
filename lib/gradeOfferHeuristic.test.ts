import { heuristicGradeOffer } from "./gradeOfferHeuristic";

describe("heuristicGradeOffer", () => {
  it("is deterministic — the same sentence always scores the same", () => {
    const sentence =
      "I help B2B SaaS founders launch faster with a Next.js boilerplate that saves 40 hours of setup time.";

    const first = heuristicGradeOffer(sentence);
    const second = heuristicGradeOffer(sentence);

    expect(first).toEqual(second);
  });

  it("qualifies the canonical example used throughout the docs and onboarding placeholder", () => {
    const result = heuristicGradeOffer(
      "I help B2B SaaS founders launch faster with a Next.js boilerplate that saves 40 hours of setup time.",
    );

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.feedback).toBe("Clear to proceed");
  });

  it("scores a hyper-specific buyer, concrete product, and measurable offer highly", () => {
    const result = heuristicGradeOffer(
      "I help solo indie hackers ship a Chrome extension that cuts customer support replies by 3 hours a week.",
    );

    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("scores a vague buyer, buzzword product, and vague offer low", () => {
    const result = heuristicGradeOffer(
      "I help businesses grow with our innovative and seamless solution for everyone.",
    );

    expect(result.score).toBeLessThan(85);
  });

  it("rejects sentences under 40 characters without running the rubric", () => {
    const result = heuristicGradeOffer("I help people.");

    expect(result.score).toBeLessThan(85);
    expect(result.feedback).toMatch(/too short/i);
  });

  it("docks multiple sentences without false-positiving on abbreviations like Next.js", () => {
    const oneSentence = heuristicGradeOffer(
      "I help B2B SaaS founders launch faster with a Next.js boilerplate that saves 40 hours of setup time.",
    );
    const twoSentences = heuristicGradeOffer(
      "I help B2B SaaS founders launch faster with a Next.js boilerplate. It saves 40 hours of setup time.",
    );

    expect(twoSentences.score).toBeLessThan(oneSentence.score);
    expect(twoSentences.feedback).toMatch(/one sentence/i);
  });

  it("never returns a score outside 0-100", () => {
    const samples = [
      "",
      "a",
      "I help businesses grow with our innovative solution that helps them grow more.",
      "I help B2B SaaS founders launch faster with a Next.js boilerplate that saves 40 hours of setup time. It also does everything else. And more. And more!",
    ];

    for (const sample of samples) {
      const { score } = heuristicGradeOffer(sample);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("marks anything scoring 85 or above as clear to proceed", () => {
    const result = heuristicGradeOffer(
      "I help B2B SaaS founders launch faster with a Next.js boilerplate that saves 40 hours of setup time.",
    );

    if (result.score >= 85) {
      expect(result.feedback).toBe("Clear to proceed");
    }
  });
});
