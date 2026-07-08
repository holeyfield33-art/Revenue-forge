import {
  canUpgradeOutcome,
  computeMilestones,
  countsFromOutcomes,
  type OutreachOutcome,
} from './milestones';

describe('computeMilestones', () => {
  it('leaves M2 locked at 0 sends', () => {
    const state = computeMilestones(true, { sent: 0, replies: 0, commitments: 0 });

    expect(state.m2).toBe(false);
    expect(state.dashboard_unlocked).toBe(false);
  });

  it('leaves M2 locked at 4 sends', () => {
    const state = computeMilestones(true, { sent: 4, replies: 0, commitments: 0 });

    expect(state.m2).toBe(false);
    expect(state.dashboard_unlocked).toBe(false);
  });

  it('unlocks M2 and the dashboard at 5 sends', () => {
    const state = computeMilestones(true, { sent: 5, replies: 0, commitments: 0 });

    expect(state.m2).toBe(true);
    expect(state.dashboard_unlocked).toBe(true);
  });

  it('keeps the dashboard locked without a qualified offer, even past 5 sends', () => {
    const state = computeMilestones(false, { sent: 5, replies: 0, commitments: 0 });

    expect(state.m1).toBe(false);
    expect(state.m2).toBe(true);
    expect(state.dashboard_unlocked).toBe(false);
  });

  it('unlocks M3 at 3 replies and M4 at 1 commitment without gating the dashboard', () => {
    const state = computeMilestones(true, { sent: 5, replies: 3, commitments: 1 });

    expect(state.m3).toBe(true);
    expect(state.m4).toBe(true);
    expect(state.dashboard_unlocked).toBe(true);
  });
});

describe('countsFromOutcomes', () => {
  it('counts commitments as replies', () => {
    const outcomes: OutreachOutcome[] = ['sent', 'reply', 'commitment', 'commitment'];
    const counts = countsFromOutcomes(outcomes);

    expect(counts.sent).toBe(4);
    expect(counts.replies).toBe(3);
    expect(counts.commitments).toBe(2);
  });

  it('reaches M3 with 2 replies and 1 commitment', () => {
    const outcomes: OutreachOutcome[] = ['reply', 'reply', 'commitment'];
    const state = computeMilestones(true, countsFromOutcomes(outcomes));

    expect(state.m3).toBe(true);
  });
});

describe('canUpgradeOutcome', () => {
  it('allows sent -> reply, sent -> commitment, and reply -> commitment', () => {
    expect(canUpgradeOutcome('sent', 'reply')).toBe(true);
    expect(canUpgradeOutcome('sent', 'commitment')).toBe(true);
    expect(canUpgradeOutcome('reply', 'commitment')).toBe(true);
  });

  it('rejects downgrades', () => {
    expect(canUpgradeOutcome('reply', 'sent')).toBe(false);
    expect(canUpgradeOutcome('commitment', 'sent')).toBe(false);
    expect(canUpgradeOutcome('commitment', 'reply')).toBe(false);
  });

  it('rejects no-op transitions', () => {
    expect(canUpgradeOutcome('sent', 'sent')).toBe(false);
    expect(canUpgradeOutcome('reply', 'reply')).toBe(false);
    expect(canUpgradeOutcome('commitment', 'commitment')).toBe(false);
  });
});
