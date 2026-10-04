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
  constructor(cause?: unknown) {
    super("Network error", { cause });
    this.name = "NetworkError";
  }
}


export class ApiError extends Error {
  status: number;
  retryAfterMs: number | null;
  constructor(
    _status: number,
    _retryAfterMs: number | null = null,
    _message?: string
  ) {
    super("not implemented");
    throw new Error("ApiError not implemented");
  }
}
