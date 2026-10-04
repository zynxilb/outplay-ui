// tests/pgn-validate.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePgnInput } from "../lib/pgn-validate.ts";

const smallPgn = `[Event "A"]\n[White "X"]\n[Black "Y"]\n\n1. e4 e5 *\n`;
const noHeadersPgn = `1. e4 e5 2. Nf3 *`;

const plies300 = Array(300).fill("e4").join(" ");
const plies301 = Array(301).fill("e4").join(" ");
const pgn300 = `[Event "A"]\n\n${plies300} *\n`;
const pgn301 = `[Event "A"]\n\n${plies301} *\n`;

test("validatePgnInput: empty string -> empty", () => {
  const r = validatePgnInput("");
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "empty");
});

test("validatePgnInput: whitespace only -> empty", () => {
  const r = validatePgnInput("   \n\n   ");
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "empty");
});

test("validatePgnInput: headers only, no moves -> empty", () => {
  const r = validatePgnInput(`[Event "A"]\n[White "X"]\n\n*\n`);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "empty");
});

test("validatePgnInput: small valid PGN -> ok", () => {
  const r = validatePgnInput(smallPgn);
  assert.equal(r.ok, true);
});

test("validatePgnInput: no headers but has moves -> ok", () => {
  const r = validatePgnInput(noHeadersPgn);
  assert.equal(r.ok, true);
});

test("validatePgnInput: exactly 300 plies -> ok", () => {
  const r = validatePgnInput(pgn300);
  assert.equal(r.ok, true);
});

test("validatePgnInput: 301 plies -> too-many-moves", () => {
  const r = validatePgnInput(pgn301);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "too-many-moves");
});

test("validatePgnInput: two [Event lines -> multiple-games", () => {
  const two = `[Event "G1"]\n[White "A"]\n\n1. e4 *\n\n[Event "G2"]\n[White "B"]\n\n1. d4 *\n`;
  const r = validatePgnInput(two);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "multiple-games");
});

test("validatePgnInput: one [Event line -> ok", () => {
  const r = validatePgnInput(smallPgn);
  assert.equal(r.ok, true);
});

test("validatePgnInput: fileSize > 1MB -> too-large", () => {
  const r = validatePgnInput(smallPgn, 1_000_001);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "too-large");
});

test("validatePgnInput: fileSize exactly 1MB -> ok", () => {
  const r = validatePgnInput(smallPgn, 1_000_000);
  assert.equal(r.ok, true);
});

test("validatePgnInput: text > 5MB -> too-large", () => {
  const huge = "x".repeat(5_000_001);
  const r = validatePgnInput(huge);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "too-large");
});

test("validatePgnInput: CRLF PGN -> ok", () => {
  const crlf = `[Event "A"]\r\n[White "X"]\r\n\r\n1. e4 e5 *\r\n`;
  const r = validatePgnInput(crlf);
  assert.equal(r.ok, true);
});


import { pgnValidationMessageAr } from "../lib/pgn-validate.ts";

test("pgnValidationMessageAr: every reason returns non-empty string", () => {
  const reasons = ["empty", "too-large", "multiple-games", "too-many-moves"] as const;
  for (const r of reasons) {
    const msg = pgnValidationMessageAr(r);
    assert.ok(typeof msg === "string" && msg.length > 0);
  }
});

test("pgnValidationMessageAr: too-many-moves mentions 300", () => {
  const msg = pgnValidationMessageAr("too-many-moves");
  assert.ok(msg.includes("300"));
});

test("pgnValidationMessageAr: multiple-games mentions one game", () => {
  const msg = pgnValidationMessageAr("multiple-games");
  assert.ok(msg.includes("واحدة") || msg.includes("مباراة واحدة"));
});
