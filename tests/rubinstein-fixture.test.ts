// tests/rubinstein-fixture.test.ts
// Offline test using captured evals from tests/fixtures/rubinstein-evals.json.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { analyzePGN, type Evaluator } from "../lib/pgn-analysis.ts";
import { expectedPoints } from "../lib/classify.ts";
import { Chess } from "chess.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "fixtures", "rubinstein-evals.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

const PGN = `[Event "Lodz"]
[White "Georg Rotlewi"]
[Black "Akiba Rubinstein"]
[Result "0-1"]

1.d4 d5 2.Nf3 e6 3.e3 c5 4.c4 Nc6 5.Nc3 Nf6 6.dxc5 Bxc5 7.a3 a6 8.b4 Bd6 9.Bb2 O-O 10.Qd2 Qe7 11.Bd3 dxc4 12.Bxc4 b5 13.Bd3 Rd8 14.Qe2 Bb7 15.O-O Ne5 16.Nxe5 Bxe5 17.f4 Bc7 18.e4 Rac8 19.e5 Bb6+ 20.Kh1 Ng4 21.Be4 Qh4 22.g3 Rxc3 23.gxh4 Rd2 24.Qxd2 Bxe4+ 25.Qg2 Rh3 0-1`;

const fixtureEvaluator: Evaluator = async (fen) => {
  const e = fixture.evals[fen];
  if (!e) throw new Error(`No fixture eval for FEN: ${fen}`);
  if (e._terminal) {
    return { score: { type: "cp", value: 0 }, bestmove: null, secondScore: null };
  }
  return {
    score: e.score,
    bestmove: e.bestmove ?? null,
    secondScore: e.secondScore ?? null,
  };
};

const bp = (x: number) => Math.round(x * 10000);

test("rubinstein fixture: exactly 4 Brilliants at expected plies", async () => {
  const { moves } = await analyzePGN(PGN, {
    evaluator: fixtureEvaluator,
    depth: 12,
    concurrency: 3,
  });

  assert.equal(moves.length, 50, "50 moves in Rubinstein game");

  const brilliants = moves.filter(m => m.classification === "Brilliant");
  const plyList = brilliants.map(m => `${m.ply}. ${m.san}`).join(", ");

  assert.equal(
    brilliants.length,
    4,
    `expected 4 Brilliants, got ${brilliants.length}: ${plyList}`
  );

  const expectedPlies = [40, 44, 46, 50];
  const actualPlies = brilliants.map(m => m.ply);
  assert.deepEqual(
    actualPlies,
    expectedPlies,
    `expected plies ${expectedPlies}, got ${actualPlies}`
  );
});

test("rubinstein fixture: 2 Brilliants have epBefore >= 9000", async () => {
  const { moves } = await analyzePGN(PGN, {
    evaluator: fixtureEvaluator,
    depth: 12,
    concurrency: 3,
  });

  function epBeforeOf(m: typeof moves[number]): number {
    const s = m.evalBefore.score;
    const cp = s.type === "mate" ? (s.value > 0 ? 10000 : -10000) : s.value;
    const turn = new Chess(m.fenBefore).turn();
    const adj = turn === "w" ? cp : -cp;
    return bp(expectedPoints(adj));
  }

  const brilliants = moves.filter(m => m.classification === "Brilliant");
  const above9000 = brilliants.filter(m => epBeforeOf(m) >= 9000);

  assert.equal(
    above9000.length,
    2,
    `expected 2 Brilliants with epBefore >= 9000, got ${above9000.length}`
  );

  const sans = above9000.map(m => `${m.ply}. ${m.san}`).sort();
  assert.deepEqual(sans.sort(), ["46. Rd2", "50. Rh3"]);
});
