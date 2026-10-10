// tests/indense10-fixture.test.ts
// Negative-sample fixture: ordinary game (Elo 1141 vs 1074).
// Chess.com analysis: 1 Brilliant (White), 0 Brilliant (Black).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Chess } from "chess.js";
import { analyzePGN, type Evaluator } from "../lib/pgn-analysis.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(here, "fixtures", "indense10-game.json"), "utf8")
);

const PGN = `[Site "Chess.com"]
[Date "2026.10.10"]
[White "indense10"]
[Black "163x"]
[Result "1-0"]
[WhiteElo "1141"]
[BlackElo "1074"]

1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nxe4 4. Qe2 d5 5. d3 Qe7 6. dxe4 Qxe5 7. Nc3 Bb4 8. Bd2 O-O 9. f4 Qf6 10. Nxd5 Bxd2+ 11. Qxd2 Qxb2 12. Rc1 Na6 13. Ne7+ Kh8 14. Bxa6 bxa6 15. O-O Qxa2 16. Ra1 Qe6 17. Nd5 Qxe4 18. Nxc7 Rb8 19. Nxa6 Bxa6 20. Rxa6 Qb7 21. Rfa1 Ra8 22. Qf2 Qb2 23. h3 Rfc8 24. R6a2 Qb4 25. Ra4 Qb2 26. R4a2 Qb4 27. Rxa7 Rab8 28. Rxf7 Qb2 29. Raa7 Rxc2 30. Qg3 Rg8 31. Kh2 Qd4 32. Rad7 Qb2 33. Qg4 Rc1 34. Rxg7 Rxg7 35. Rd8+ Rg8 36. Rxg8# 1-0`;

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

test("indense10 negative sample: exactly 1 Brilliant (34.Rxg7, White)", async () => {
  const { moves } = await analyzePGN(PGN, {
    evaluator: fixtureEvaluator,
    depth: 12,
    concurrency: 3,
  });

  assert.equal(moves.length, 71, "71 moves in this game");

  const brilliants = moves.filter(m => m.classification === "Brilliant");
  const summary = brilliants.map(m => `${m.ply}. ${m.san}`).join(", ");

  assert.equal(
    brilliants.length,
    1,
    `expected 1 Brilliant, got ${brilliants.length}: ${summary}`
  );

  const only = brilliants[0];
  assert.equal(only.san, "Rxg7", `expected Rxg7, got ${only.san}`);
  assert.equal(only.ply, 67, `expected ply 67 (34.Rxg7), got ${only.ply}`);

  // Color derived from FEN turn field
  const turn = new Chess(only.fenBefore).turn();
  assert.equal(turn, "w", "34.Rxg7 is a White move");
});

test("indense10: no Brilliant for Black (matches Chess.com)", async () => {
  const { moves } = await analyzePGN(PGN, {
    evaluator: fixtureEvaluator,
    depth: 12,
    concurrency: 3,
  });

  const blackBrilliants = moves.filter(m => {
    if (m.classification !== "Brilliant") return false;
    return new Chess(m.fenBefore).turn() === "b";
  });
  assert.equal(blackBrilliants.length, 0);
});
