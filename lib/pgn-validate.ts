// lib/pgn-validate.ts
export type PgnValidationReason =
  | "empty"
  | "too-large"
  | "multiple-games"
  | "too-many-moves";

export type PgnValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: PgnValidationReason };

export function validatePgnInput(
  _text: string,
  _fileSize?: number
): PgnValidationResult {
  throw new Error("validatePgnInput is not implemented");
}
