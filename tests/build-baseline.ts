import { Stockfish } from "@se-oss/stockfish";
import fs from "node:fs";

const FENS = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 4",
  "r1bq1rk1/1pp2ppp/p1np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQR1K1 w - - 6 9",
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
  "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1",
  "8/8/8/4k3/8/8/4R3/4K3 w - - 0 1",
  "8/8/8/4k3/8/8/4Q3/4K3 w - - 0 1",
  "6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
  "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
  "k6r/8/8/8/8/5b2/8/7K w - - 0 1",
  "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
  "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
  "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2",
  "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4",
  "8/4k3/8/4P3/8/8/4K3/8 w - - 0 1",
  "1K6/1P6/8/8/8/8/r7/7k w - - 0 1",
  "r5rk/5p1p/5R2/4Q3/8/8/7P/7K w - - 0 1",
];

async function main() {
  const results: any[] = [];
  for (let i = 0; i < FENS.length; i++) {
    const engine = new Stockfish();
    try {
      await engine.waitReady();
      const a = await engine.analyze(FENS[i], 12, 2);
      const lines = a.lines ?? [];
      results.push({
        index: i + 1,
        fen: FENS[i],
        best: a.bestmove ?? null,
        pv0: lines[0]?.pv ?? null,
        pv1: lines[1]?.pv ?? null,
        score0: lines[0]?.score ?? null,
        score1: lines[1]?.score ?? null,
        depth: lines[0]?.depth ?? null,
      });
    } finally {
      engine.terminate();
    }
    process.stderr.write(`.`);
  }
  process.stderr.write("\n");
  fs.writeFileSync("tests/baseline-depth12.json", JSON.stringify(results, null, 2));
  console.log(`✅ Saved ${results.length} positions to tests/baseline-depth12.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
