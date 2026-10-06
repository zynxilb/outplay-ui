// lib/view-ply.ts

/**
 * Resolve which ply to display on the board given a MoveList selection.
 *
 * Returns:
 * - `null` for the live position (no selection, last ply, invalid input)
 * - the ply number otherwise (1 ≤ ply < movesLength)
 *
 * `ply === movesLength` means "the last move" which is also the live
 * position — no need to enter preview mode.
 */
export function resolveViewPly(
  selectedPly: number | null,
  movesLength: number
): number | null {
  if (selectedPly === null) return null;
  if (!Number.isInteger(selectedPly)) return null;
  if (selectedPly < 1) return null;
  if (selectedPly >= movesLength) return null;
  return selectedPly;
}
