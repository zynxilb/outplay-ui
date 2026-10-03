// tests/pgn.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHeaders } from "../lib/pgn.ts";

const FULL_PGN = `[Event "Casual Game"]
[Site "?"]
[Date "2024.01.15"]
[White "Magnus"]
[Black "Hikaru"]
[Result "1-0"]
[WhiteElo "2850"]
[BlackElo "2780"]

1. e4 e5 2. Nf3 Nc6 1-0
`;

test("parseHeaders: reads all standard headers", () => {
  const h = parseHeaders(FULL_PGN);
  assert.equal(h.white, "Magnus");
  assert.equal(h.black, "Hikaru");
  assert.equal(h.whiteElo, 2850);
  assert.equal(h.blackElo, 2780);
  assert.equal(h.result, "1-0");
  assert.equal(h.date, "2024.01.15");
  assert.equal(h.event, "Casual Game");
});

test("parseHeaders: missing Elo -> undefined", () => {
  const pgn = `[White "A"]\n[Black "B"]\n\n1. e4 e5 *\n`;
  const h = parseHeaders(pgn);
  assert.equal(h.whiteElo, undefined);
  assert.equal(h.blackElo, undefined);
});

test("parseHeaders: leading blank lines + non-standard order", () => {
  const pgn = `\n\n[BlackElo "1500"]\n[WhiteElo "1600"]\n[Black "Z"]\n[White "Y"]\n\n1. d4 d5 *\n`;
  const h = parseHeaders(pgn);
  assert.equal(h.whiteElo, 1600);
  assert.equal(h.blackElo, 1500);
  assert.equal(h.white, "Y");
  assert.equal(h.black, "Z");
});
