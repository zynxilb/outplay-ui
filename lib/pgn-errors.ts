// lib/pgn-errors.ts

export class InvalidFenError extends Error {
  fen: string;
  constructor(fen: string) {
    super(`Invalid start FEN: ${fen}`);
    this.name = "InvalidFenError";
    this.fen = fen;
  }
}

export class IllegalMoveError extends Error {
  ply: number;
  san: string;
  constructor(ply: number, san: string, reason?: string) {
    const suffix = reason ? ` (${reason})` : "";
    super(`Illegal move at ply ${ply}: ${san}${suffix}`);
    this.name = "IllegalMoveError";
    this.ply = ply;
    this.san = san;
  }
}


export class NetworkError extends Error {
  cause?: unknown;
  constructor(_cause?: unknown) {
    super("Network error");
    throw new Error("NetworkError not implemented");
  }
}
