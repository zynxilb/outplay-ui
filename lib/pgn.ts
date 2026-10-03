// lib/pgn.ts
export interface PGNHeaders {
  event?: string;
  date?: string;
  white?: string;
  black?: string;
  result?: string;
  whiteElo?: number;
  blackElo?: number;
}

export function parseHeaders(_text: string): PGNHeaders {
  throw new Error("parseHeaders is not implemented");
}
