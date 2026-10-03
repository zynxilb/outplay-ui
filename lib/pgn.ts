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

/**
 * Extract PGN headers from the header section.
 * Headers look like: [Key "Value"]
 * Skips leading blank lines. Stops at first blank line AFTER at least one header.
 * Non-numeric Elo values become undefined.
 */
export function parseHeaders(text: string): PGNHeaders {
  const headers: PGNHeaders = {};
  const lines = text.split(/\r?\n/);
  let seenHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      // Only stop once we've entered the header section
      if (seenHeader) break;
      continue;
    }

    const match = trimmed.match(/^\[([A-Za-z]+)\s+"(.*)"\]$/);
    if (!match) continue;

    seenHeader = true;
    const [, key, value] = match;

    switch (key) {
      case "Event":   headers.event  = value; break;
      case "Date":    headers.date   = value; break;
      case "White":   headers.white  = value; break;
      case "Black":   headers.black  = value; break;
      case "Result":  headers.result = value; break;
      case "WhiteElo": {
        const n = parseInt(value, 10);
        headers.whiteElo = Number.isFinite(n) ? n : undefined;
        break;
      }
      case "BlackElo": {
        const n = parseInt(value, 10);
        headers.blackElo = Number.isFinite(n) ? n : undefined;
        break;
      }
    }
  }

  return headers;
}


export function parseMoves(_text: string): string[] {
  throw new Error("parseMoves is not implemented");
}
