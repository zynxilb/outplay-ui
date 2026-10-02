// tests/step-b.ts
// 1. Print UCI id name
// 2. Set threads=1, hash=16 explicitly
// 3. Regenerate baseline with meta
// 4. Compare to previous

import { Stockfish } from "@se-oss/stockfish";
import fs from "node:fs";

const FENS = JSON.parse(fs.readFileSync("tests/baseline-depth12.json", "utf8")).map((r: any) => r.fen);

async function main() {
  // ===== 1. Print UCI id =====
  console.log("=== UCI identification ===");
  const probe = new Stockfish();
  await probe.waitReady();

  // Capture all engine output for a few ms
  const lines: string[] = [];
  const engineAny = probe as any;
  if (engineAny.on) {
    engineAny.on("data", (d: any) => lines.push(String(d)));
  }
  // Try to force uci output
  try { await probe.send("uci"); } catch {}
  await new Promise((r) => setTimeout(r, 500));
  console.log("Captured lines (filtered):");
  for (const l of lines) {
    if (l.match(/id name|id author|uciok/i)) console.log("  " + l.trim());
  }
  probe.terminate();

  // ===== 2. Test explicit options =====
  console.log("\n=== Testing explicit constructor options ===");
  const engineDesc = "new Stockfish() + setOptions({Threads:1, Hash:16})";
  const e = new Stockfish();
  await e.waitReady();
  if (typeof (e as any).setOptions === "function") {
    await (e as any).setOptions({ Threads: 1, Hash: 16 });
    console.log("  ✅ setOptions({Threads:1, Hash:16}) called");
  } else {
    await e.send("setoption name Threads value 1");
    await e.send("setoption name Hash value 16");
    console.log("  ✅ setoption fallback");
  }
  await e.send("isready");
  e.terminate();

  // ===== 3. Regenerate with meta + explicit options =====
  console.log("\n=== Regenerating baseline (explicit threads=1, hash=16) ===");
  const results: any[] = [];
  for (let i = 0; i < FENS.length; i++) {
    const engine = new Stockfish();
    await engine.waitReady();
    await (engine as any).setOptions({ Threads: 1, Hash: 16 });
    try {
      await engine.waitReady();
      const a = await engine.analyze(FENS[i], 12, 2);
      const ls = a.lines ?? [];
      results.push({
        index: i + 1,
        fen: FENS[i],
        best: a.bestmove ?? null,
        pv0: ls[0]?.pv ?? null,
        pv1: ls[1]?.pv ?? null,
        score0: ls[0]?.score ?? null,
        score1: ls[1]?.score ?? null,
        depth: ls[0]?.depth ?? null,
      });
    } finally {
      engine.terminate();
    }
    process.stderr.write(".");
  }
  process.stderr.write("\n");

  const meta = {
    engine: "Stockfish 17.1 (from @se-oss/stockfish)",
    threads: 1,
    hash: 16,
    depth: 12,
    multiPV: 2,
    optionsMethod: engineDesc,
  };

  const withMeta = { meta, positions: results };
  fs.writeFileSync("tests/baseline-depth12-new.json", JSON.stringify(withMeta, null, 2));
  console.log(`✅ Saved ${results.length} positions to tests/baseline-depth12-new.json`);

  // ===== 4. Compare to previous =====
  const old = JSON.parse(fs.readFileSync("tests/baseline-depth12.json", "utf8"));
  let diffs = 0;
  for (let i = 0; i < old.length; i++) {
    const a = old[i];
    const b = results[i];
    if (a.best !== b.best || a.pv0 !== b.pv0 || a.pv1 !== b.pv1 ||
        JSON.stringify(a.score0) !== JSON.stringify(b.score0) ||
        JSON.stringify(a.score1) !== JSON.stringify(b.score1)) {
      diffs++;
      console.log(`  Position ${i + 1} DIFF:`);
      console.log(`    OLD: best=${a.best} s0=${JSON.stringify(a.score0)} pv0=${a.pv0}`);
      console.log(`    NEW: best=${b.best} s0=${JSON.stringify(b.score0)} pv0=${b.pv0}`);
    }
  }
  console.log(`\nDiffs vs old baseline: ${diffs}/${old.length}`);
  if (diffs === 0) console.log("✅ IDENTICAL — defaults were indeed threads=1, hash=16");
  else console.log("⚠️ Defaults differed from explicit 1/16");
}

main().catch((e) => { console.error(e); process.exit(1); });
