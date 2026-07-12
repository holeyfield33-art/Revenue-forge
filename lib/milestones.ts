export type OutreachOutcome = "sent" | "reply" | "commitment";

export const MILESTONE_TARGETS = {
  sent: 5,
  replies: 3,
  commitments: 1,
} as const;

export interface MilestoneCounts {
  sent: number;
  replies: number;
  commitments: number;
}

export interface MilestoneState extends MilestoneCounts {
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  dashboard_unlocked: boolean;
}

// Mirrors the check_milestone_gate RPC. Milestones are cumulative and never
// reset: M1 comes from the offer gate, M2-M4 from outreach counts. The
// dashboard unlocks at M1 AND M2; M3/M4 are displayed progress only.
export function computeMilestones(
  hasQualifiedOffer: boolean,
  counts: MilestoneCounts,
): MilestoneState {
  const m2 = counts.sent >= MILESTONE_TARGETS.sent;
  const m3 = counts.replies >= MILESTONE_TARGETS.replies;
  const m4 = counts.commitments >= MILESTONE_TARGETS.commitments;

  return {
    ...counts,
    m1: hasQualifiedOffer,
    m2,
    m3,
    m4,
    dashboard_unlocked: hasQualifiedOffer && m2,
  };
}

// A commitment is a conversation that went further, so it also counts as a reply.
export function countsFromOutcomes(
  outcomes: OutreachOutcome[],
): MilestoneCounts {
  return {
    sent: outcomes.length,
    replies: outcomes.filter((o) => o === "reply" || o === "commitment").length,
    commitments: outcomes.filter((o) => o === "commitment").length,
  };
}

// Records only harden: sent -> reply, sent -> commitment, reply -> commitment.
export function canUpgradeOutcome(
  from: OutreachOutcome,
  to: OutreachOutcome,
): boolean {
  if (from === "sent") {
    return to === "reply" || to === "commitment";
  }
  if (from === "reply") {
    return to === "commitment";
  }
  return false;
}
