// lib/pgn-errors.ts
export class InvalidFenError extends Error {
  fen: string;
  constructor(_fen: string) {
    super("not implemented");
    throw new Error("InvalidFenError not implemented");
  }
}

export class IllegalMoveError extends Error {
  ply: number;
  san: string;
  constructor(_ply: number, _san: string, _reason?: string) {
    super("not implemented");
    throw new Error("IllegalMoveError not implemented");
  }
}
