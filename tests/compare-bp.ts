// tests/compare-bp.ts
// Compare new basis-point classify.ts vs previous float version.
// Any diff must be within 0.00005 of a threshold (rounding artifact).
// Any other diff is UNEXPLAINED and fails the run.

import { classifyMove as newClassify } from "../lib/classify.ts";
import { prevClassifyMove as prevClassify } from "./prev-classify.ts";

const THRESHOLDS = [
  0.02, 0.05, 0.10, 0.20,       // classification
  0.15, 0.55, 0.70, 0.10, 0.30, // Miss (bigLoss, gaveAway, wasWinning, prevOpp, stillNotLosing)
  0.50, 0.90,                    // Brilliant
  0.10, 0.70, 0.30,              // Great (gap, crossesWin, crossesLoss)
];

function nearThreshold(epLoss: number): boolean {
  return THRESHOLDS.some((t) => Math.abs(epLoss - t) < 0.00005);
}

const evals = [-1000, -500, -300, -100, -50, 0, 50, 100, 200, 300, 500, 1000];
const secondEvals: (number | null)[] = [null, -500, -300, -100, 0, 100, 300, 500];
const prevOppLosses: (number | undefined)[] = [undefined, 0.0, 0.05, 0.1, 0.2, 0.5];
const legalCounts = [1, 2, 30];
const colors: ("w" | "b")[] = ["w", "b"];
const bools = [true, false];

let total = 0;
let diffs = 0;
let explained = 0;
let unexplained = 0;
const unexplainedSamples: string[] = [];

for (const eb of evals) {
  for (const ea of evals) {
    for (const color of colors) {
      for (const isBest of bools) {
        for (const isSac of bools) {
          for (const sb of secondEvals) {
            for (const prev of prevOppLosses) {
              for (const lm of legalCounts) {
                const input: any = {
                  isBest, isBook: false, isSacrifice: isSac,
                  evalBefore: eb, evalAfter: ea,
                  secondBestEval: sb, moverColor: color, legalMoves: lm,
                };
                if (prev !== undefined) input.prevOppEpLoss = prev;
                total++;
                const newR = newClassify(input);
                const prevR = prevClassify(input);
                if (newR !== prevR) {
                  diffs++;
                  // Compute epLoss for this case
                  const mb = color === "w" ? eb : -eb;
                  const ma = color === "w" ? ea : -ea;
                  const k = 0.00368208;
                  const ep = (cp: number) => 1 / (1 + Math.exp(-k * cp));
                  const epLoss = Math.abs(ep(mb) - ep(ma));
                  if (nearThreshold(epLoss)) {
                    explained++;
                  } else {
                    unexplained++;
                    if (unexplainedSamples.length < 10) {
                      unexplainedSamples.push(
                        `eb=${eb} ea=${ea} c=${color} best=${isBest} sac=${isSac} sb=${sb} prev=${prev} lm=${lm} :: ${prevR} -> ${newR} (epLoss=${epLoss.toFixed(6)})`
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

console.log(`Total cases: ${total}`);
console.log(`Total diffs: ${diffs}`);
console.log(`  Explained (near threshold): ${explained}`);
console.log(`  UNEXPLAINED: ${unexplained}`);
if (unexplained > 0) {
  console.log("\nUnexplained samples:");
  for (const s of unexplainedSamples) console.log(`  ${s}`);
  process.exit(1);
}
console.log("\n✅ All diffs explained by rounding near thresholds.");
