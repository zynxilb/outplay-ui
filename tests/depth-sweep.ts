// tests/depth-sweep.ts
// Compare eval stability across depths 12, 16, 20 on the same 20 positions.
// Reference = depth 20. Fresh engine per position, threads=1, hash=16, MultiPV=2.

import { Stockfish } from "@se-oss/stockfish";
import fs from "node:fs";

const K = 0.00368208;
function cpToBp(cp: number): number {
  const ep = 1 / (1 + Math.exp(-K * cp));
  return Math.round(ep * 10000);
}
function scoreToBp(s: any): number | null {
  if (!s) return null;
  if (s.type === "cp") return cpToBp(s.value);
  if (s.type === "mate") return s.value > 0 ? 10000 : 0;
  return null;
}

const FENS = JSON.parse(fs.readFileSync("tests/baseline-depth12.json", "utf8"))
  .positions.map((r: any) => r.fen);

type Row = {
  idx: number;
  best: string | null;
  bp: number | null;
  timeMs: number;
};

async function runDepth(depth: number): Promise<Row[]> {
  const out: Row[] = [];
  for (let i = 0; i < FENS.length; i++) {
    const e = new Stockfish();
    await e.waitReady();
    await (e as any).setOptions({ Threads: 1, Hash: 16 });
    const t0 = Date.now();
    const a = await e.analyze(FENS[i], depth, 2);
    const t = Date.now() - t0;
    e.terminate();
    const lines = a.lines ?? [];
    out.push({
      idx: i + 1,
      best: a.bestmove ?? null,
      bp: scoreToBp(lines[0]?.score),
      timeMs: t,
    });
    process.stderr.write(".");
  }
  process.stderr.write("\n");
  return out;
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function p90(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.floor(0.9 * (s.length - 1));
  return s[i];
}

async function main() {
  console.log("=== Depth sweep: 12, 16, 20 ===");
  const t0 = Date.now();
  const r12 = await runDepth(12);
  const r16 = await runDepth(16);
  const r20a = await runDepth(20);
  const r20b = await runDepth(20);
  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Total wall time: ${totalSec}s\n`);

  let selfDiffs = 0;
  for (let i = 0; i < 20; i++) {
    if (r20a[i].best !== r20b[i].best || r20a[i].bp !== r20b[i].bp) selfDiffs++;
  }
  console.log(`Depth 20 self-consistency: ${selfDiffs}/20 diffs ${selfDiffs === 0 ? "OK" : "FAIL"}`);

  function compare(name: string, r: Row[]) {
    const deltas: number[] = [];
    let agree = 0;
    const times: number[] = [];
    for (let i = 0; i < 20; i++) {
      const ref = r20a[i];
      const cur = r[i];
      if (ref.bp !== null && cur.bp !== null) {
        deltas.push(Math.abs(ref.bp - cur.bp));
      }
      if (ref.best && cur.best && ref.best === cur.best) agree++;
      times.push(cur.timeMs);
    }
    console.log(`\n--- ${name} vs depth 20 ---`);
    console.log(`  |dEP| median: ${median(deltas)} bp`);
    console.log(`  |dEP| p90:    ${p90(deltas)} bp`);
    console.log(`  |dEP| max:    ${Math.max(...deltas)} bp`);
    console.log(`  Best-move agreement: ${agree}/20 (${agree * 5}%)`);
    console.log(`  Time median: ${median(times)} ms, max: ${Math.max(...times)} ms`);
  }

  compare("depth 12", r12);
  compare("depth 16", r16);
}

main().catch((e) => { console.error(e); process.exit(1); });
