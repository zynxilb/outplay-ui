// lib/next-board-action.ts

/**
 * Pure decision function for the board-goto effect in app/play/page.tsx.
 *
 * Given the previous and current viewPly values, plus the saved live ply
 * and the model's current historyLength, returns the single `goto` action
 * to perform (or null for no-op).
 *
 * Extracted from the React effect so the transition logic can be unit
 * tested without a DOM or a board model.
 *
 * Invariants:
 * - In preview: goto the requested ply (clamped to historyLength).
 * - Exiting preview: goto the saved live ply (clamped, or historyLength).
 * - live → live: no-op (gigaboard is already at the live position).
 */
export type BoardAction = { goto: number } | null;

export function nextBoardAction(
  prevViewPly: number | null,
  viewPly: number | null,
  savedLivePly: number | null,
  historyLength: number
): BoardAction {
  const wasPreview = prevViewPly !== null;
  const isPreview = viewPly !== null;

  if (isPreview) {
    return { goto: Math.min(viewPly, historyLength) };
  }

  if (wasPreview) {
    const target = savedLivePly ?? historyLength;
    return { goto: Math.min(target, historyLength) };
  }

  return null;
}
