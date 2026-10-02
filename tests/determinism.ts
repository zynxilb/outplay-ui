// tests/determinism.ts
// Check if Stockfish (via @se-oss/stockfish) is deterministic
// at fixed depth=12, multiPV=2, default threads/hash.

import { Stockfish } from "@se-oss/stockfish";

// 20 diverse positions: opening, middlegame, endgame, mate-in-1, forced.
const FENS = [
  // Starting position
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // Ruy Lopez after 4.Ba4
  "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 4",
  // Ruy Lopez middlegame
  "r1bq1rk1/1pp2ppp/p1np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQR1K1 w - - 6 9",
  // Italian game
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  // Sicilian Najdorf
  "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
  // Endgame: K+P vs K
  "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1",
  // Endgame: K+R vs K
  "8/8/8/4k3/8/8/4R3/4K3 w - - 0 1",
  // Endgame: K+Q vs K
  "8/8/8/4k3/8/8/4Q3/4K3 w - - 0 1",
  // Mate in 1: Qh7#
  "6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
  // Mate in 1: back rank
  "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
  // Forced move: Kg1 only
  "k6r/8/8/8/8/5b2/8/7K w - - 0 1",
  // French Defense
  "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
  // Caro-Kann
  "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
  // Queen's Gambit
  "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2",
  // King's Indian
  "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
  // Tactical: fork available
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  // Pin setup
  "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4",
  // Passed pawn endgame
  "8/4k3/8/4P3/8/8/4K3/8 w - - 0 1",
  // Rook endgame (Lucena-like)
  "1K6/1P6/8/8/8/8/r7/7k w - - 0 1",
  // Smothered mate setup
  "r5rk/5p1p/5R2/4Q3/8/8/7P/7K w - - 0 1",
];

async function analyzeOnce(fen: string): Promise<string> {
  const engine = new Stockfish();
  try {
    await engine.waitReady();
    const analysis = await engine.analyze(fen, 12, 2);
    const lines = analysis.lines ?? [];
    const p = lines[0]?.score;
    const s = lines[1]?.score;
    const pv0 = lines[0]?.pv ?? "";
    const pv1 = lines[1]?.pv ?? "";
    return JSON.stringify({
      best: analysis.bestmove ?? null,
      p: p ? `${p.type}:${p.value}` : null,
      s: s ? `${s.type}:${s.value}` : null,
      pv0, pv1,
    });
  } finally {
    engine.terminate();
  }
}

async function main() {
  console.log("=== Test 1: Repeatability (3 runs, fresh engines) ===");
  let repeatDiffs = 0;
  for (let i = 0; i < FENS.length; i++) {
    const r1 = await analyzeOnce(FENS[i]);
    const r2 = await analyzeOnce(FENS[i]);
    const r3 = await analyzeOnce(FENS[i]);
    if (r1 !== r2 || r2 !== r3) {
      repeatDiffs++;
      console.log(`  Position ${i + 1}: DIFF`);
      console.log(`    R1: ${r1}`);
      console.log(`    R2: ${r2}`);
      console.log(`    R3: ${r3}`);
    }
  }
  console.log(`Repeatability diffs: ${repeatDiffs}/${FENS.length}`);

  console.log("\n=== Test 2: Order (same engine, 2 orders) ===");
  // Same engine, run all positions in forward order, then new engine in reverse
  async function runAll(order: number[]): Promise<string[]> {
    const engine = new Stockfish();
    try {
      await engine.waitReady();
      const results: string[] = [];
      for (const i of order) {
        const a = await engine.analyze(FENS[i], 12, 2);
        const lines = a.lines ?? [];
        const p = lines[0]?.score;
        const pv0 = lines[0]?.pv ?? "";
        results.push(JSON.stringify({
          best: a.bestmove ?? null,
          p: p ? `${p.type}:${p.value}` : null,
          pv0,
        }));
      }
      return results;
    } finally {
      engine.terminate();
    }
  }

  const fwd = await runAll([...Array(FENS.length).keys()]);
  const rev = await runAll([...Array(FENS.length).keys()].reverse());

  // rev needs to be re-reversed to compare
  const revRestored = [...rev].reverse();
  let orderDiffs = 0;
  const maxCpDiff = { pos: -1, diff: 0 };
  for (let i = 0; i < FENS.length; i++) {
    if (fwd[i] !== revRestored[i]) {
      orderDiffs++;
      console.log(`  Position ${i + 1}: DIFF`);
      console.log(`    FWD: ${fwd[i]}`);
      console.log(`    REV: ${revRestored[i]}`);
    }
  }
  console.log(`Order diffs: ${orderDiffs}/${FENS.length}`);

  console.log("\n=== SUMMARY ===");
  console.log(`Repeatability: ${repeatDiffs === 0 ? "PASS" : "FAIL"}`);
  console.log(`Order:         ${orderDiffs === 0 ? "PASS" : "FAIL"}`);
  if (repeatDiffs === 0 && orderDiffs === 0) {
    console.log("✅ Engine is deterministic.");
  } else {
    console.log("⚠️ Engine is NOT deterministic — see diffs above.");
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
