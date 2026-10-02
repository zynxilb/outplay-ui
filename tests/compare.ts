import { classifyMove as newClassify, expectedPoints } from "../lib/classify.ts";
import { legacyClassifyMove as oldClassify } from "./legacy-classify.ts";

function classifyFix(input: any, oldR: string, newR: string): string {
  const { prevOppEpLoss, legalMoves, evalBefore, evalAfter, moverColor } = input;
  const epAfter = expectedPoints(moverColor === "w" ? evalAfter : -evalAfter);

  // Fix 6: forced move
  if (legalMoves === 1 && oldR === "Great") return "6-forcedMove";

  // Fix 5: first move (undefined prev triggers default=1 in old, null in new)
  if (prevOppEpLoss === undefined && oldR === "Miss") return "5-firstMove";

  // Fix 3: Miss ceiling (epAfter < 0.3 means not Miss anymore)
  if (oldR === "Miss" && epAfter < 0.3) return "3-missCeiling";

  // Fix 4: Miss precedence (remaining Miss->non-Miss)
  if (oldR === "Miss" && newR !== "Miss") return "4-missPrecedence";

  return "UNEXPLAINED";
}

const evals = [-500, -300, -100, 0, 100, 200, 300, 500];
const secondEvals: (number | null)[] = [null, -500, -300, -100, 0, 100, 300, 500];
const prevOppLosses: (number | undefined)[] = [undefined, 0.0, 0.05, 0.1, 0.2, 0.5];
const legalCounts = [1, 2, 30];
const colors: ("w" | "b")[] = ["w", "b"];
const bools = [true, false];

let total = 0;
let totalDiffs = 0;
const fixCounts: Record<string, number> = {};
const samples: Record<string, string[]> = {};
const unexplained: string[] = [];

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
                const oldR = oldClassify(input);
                const newR = newClassify(input);
                if (oldR !== newR) {
                  totalDiffs++;
                  const fix = classifyFix(input, oldR, newR);
                  fixCounts[fix] = (fixCounts[fix] || 0) + 1;
                  if (!samples[fix]) samples[fix] = [];
                  const tag = `eb=${eb} ea=${ea} c=${color} best=${isBest} sac=${isSac} sb=${sb} prev=${prev} lm=${lm} :: ${oldR}->${newR}`;
                  if (samples[fix].length < 3) samples[fix].push(tag);
                  if (fix === "UNEXPLAINED" && unexplained.length < 20) unexplained.push(tag);
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
console.log(`Total differences: ${totalDiffs}`);
console.log("");
console.log("Breakdown by fix:");
for (const [k, v] of Object.entries(fixCounts)) console.log(`  ${k}: ${v}`);
console.log("");
console.log("Samples per fix:");
for (const [k, arr] of Object.entries(samples)) {
  console.log(`  ${k}:`);
  for (const s of arr) console.log(`    ${s}`);
}
console.log("");
if (unexplained.length > 0) {
  console.log("⚠️ UNEXPLAINED (first 20):");
  for (const u of unexplained) console.log(`  ${u}`);
  process.exit(1);
} else {
  console.log("✅ All differences explained by fixes 3-6.");
}
