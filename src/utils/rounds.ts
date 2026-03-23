/**
 * Fisher–Yates shuffle. Returns a new array so the original is not mutated.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks a round of items from the pool: shuffles the full pool and returns the first `roundSize` items.
 * Each call gives maximum variety in both order and which items appear together.
 */
export function getRoundItems<T>(pool: T[], roundSize: number): T[] {
  if (pool.length <= roundSize) return shuffle(pool);
  return shuffle(pool).slice(0, roundSize);
}

/** Default round sizes per module type (questions vs exercises). */
export const ROUND_SIZES = {
  /** Flash Synonyms, Connector Speed Match: 10 questions per round */
  questions: 10,
  /** Connector Bank, Paragraph Evaluator, Text Reconstructor: 5 exercises per round */
  exercises: 5,
  /** Spot the Spanglish, Bubble Brainstorm: 5 items per round */
  activities: 5,
} as const;
