// lib/pgn-validate.ts
import { parseMoves } from "./pgn.ts";

const MAX_FILE_SIZE = 1_000_000;       // 1 MB
const MAX_TEXT_LENGTH = 5_000_000;     // 5 MB chars
const MAX_PLIES = 300;

export type PgnValidationReason =
  | "empty"
  | "too-large"
  | "multiple-games"
  | "too-many-moves";

export type PgnValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: PgnValidationReason };

/**
 * Validate raw PGN input before running analyzePGN.
 * Order: fileSize -> text.length -> multi-game -> parseMoves (once) -> ply count.
 */
export function validatePgnInput(
  text: string,
  fileSize?: number
): PgnValidationResult {
  // 1) Size checks
  if (typeof fileSize === "number" && fileSize > MAX_FILE_SIZE) {
    return { ok: false, reason: "too-large" };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { ok: false, reason: "too-large" };
  }

  // 2) Multi-game detection: more than one [Event "..." line at start-of-line
  const eventMatches = text.match(/^\[Event\s/gm);
  if (eventMatches && eventMatches.length > 1) {
    return { ok: false, reason: "multiple-games" };
  }

  // 3) Parse moves once
  const sans = parseMoves(text);
  if (sans.length === 0) {
    return { ok: false, reason: "empty" };
  }
  if (sans.length > MAX_PLIES) {
    return { ok: false, reason: "too-many-moves" };
  }

  return { ok: true, text };
}
