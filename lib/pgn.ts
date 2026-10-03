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

export function parseHeaders(text: string): PGNHeaders {
  const headers: PGNHeaders = {};
  const lines = text.split(/\r?\n/);
  let seenHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
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

// TODO (deferred, not in scope): `;` line comments, annotation suffixes (e4!, e4?!)
export function parseMoves(text: string): string[] {
  const moves: string[] = [];

  const body = text
    .split(/\r?\n/)
    .filter(line => !/^\s*\[/.test(line))
    .join(" ");

  let inBrace = false;
  let parenDepth = 0;
  let current = "";

  const flush = (tok: string) => {
    if (!tok) return;
    tok = tok.replace(/^\d+\.+/, "");
    if (!tok) return;
    if (tok === "...") return;
    if (/^\$\d+$/.test(tok)) return;
    if (tok === "1-0" || tok === "0-1" || tok === "1/2-1/2" || tok === "*") return;
    moves.push(tok);
  };

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];

    if (inBrace) {
      if (ch === "}") inBrace = false;
      continue;
    }
    if (ch === "{") {
      inBrace = true;
      flush(current); current = "";
      continue;
    }
    if (ch === "(") {
      parenDepth++;
      flush(current); current = "";
      continue;
    }
    if (ch === ")") {
      if (parenDepth > 0) parenDepth--;
      continue;
    }
    if (parenDepth > 0) continue;
    if (/\s/.test(ch)) {
      flush(current); current = "";
      continue;
    }
    current += ch;
  }
  flush(current);

  return moves;
}
