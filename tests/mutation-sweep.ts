// tests/mutation-sweep.ts
import { execSync } from "node:child_process";
import fs from "node:fs";

const ORIGINAL = fs.readFileSync("lib/classify.ts", "utf8");

type Mut = { label: string; find: string; replace: string };

const mutations: Mut[] = [
  // Miss thresholds
  { label: "Miss bigLoss 0.15 -> 0.25", find: "bigLoss = epLoss >= 0.15", replace: "bigLoss = epLoss >= 0.25" },
  { label: "Miss gaveItAway 0.55 -> 0.65", find: "epAfter <= 0.55", replace: "epAfter <= 0.65" },
  { label: "Miss wasWinning 0.7 -> 0.8", find: "epBefore >= 0.7", replace: "epBefore >= 0.8" },
  { label: "Miss prevOpp 0.1 -> 0.2", find: "opponentBlundered = prevOppEpLoss !== null && prevOppEpLoss >= 0.1", replace: "opponentBlundered = prevOppEpLoss !== null && prevOppEpLoss >= 0.2" },
  { label: "Miss stillNotLosing 0.3 -> 0.4", find: "stillNotLosing = epAfter >= 0.3", replace: "stillNotLosing = epAfter >= 0.4" },

  // Brilliant
  { label: "Brilliant epAfter 0.5 -> 0.6", find: "epAfter >= 0.5", replace: "epAfter >= 0.6" },
  { label: "Brilliant epBefore 0.9 -> 0.8", find: "epBefore < 0.9", replace: "epBefore < 0.8" },

  // Great
  { label: "Great gap 0.1 -> 0.15", find: "if (gap >= 0.1", replace: "if (gap >= 0.15" },
  { label: "Great crossesWin 0.7 -> 0.75", find: "epBefore >= 0.7 && epSecond < 0.7", replace: "epBefore >= 0.75 && epSecond < 0.75" },
  { label: "Great crossesLoss 0.3 -> 0.35", find: "epBefore >= 0.3 && epSecond < 0.3", replace: "epBefore >= 0.35 && epSecond < 0.35" },

  // Classification thresholds
  { label: "Excellent 0.02 -> 0.03", find: 'if (epLoss <= 0.02) return "Excellent";', replace: 'if (epLoss <= 0.03) return "Excellent";' },
  { label: "Good 0.05 -> 0.06", find: 'if (epLoss <= 0.05) return "Good";', replace: 'if (epLoss <= 0.06) return "Good";' },
  { label: "Inaccuracy 0.1 -> 0.11", find: 'if (epLoss <= 0.1) return "Inaccuracy";', replace: 'if (epLoss <= 0.11) return "Inaccuracy";' },
  { label: "Mistake 0.2 -> 0.21", find: 'if (epLoss <= 0.2) return "Mistake";', replace: 'if (epLoss <= 0.21) return "Mistake";' },
];

const TEST_FILES = [
  "tests/classify.test.ts",
  "tests/fixes.test.ts",
  "tests/boundary.test.ts",
  "tests/wiring.test.ts",
  "tests/mutation-killers.test.ts",
];

function runTests(): { pass: number; fail: number } {
  try {
    const out = execSync(
      `node --experimental-strip-types --test ${TEST_FILES.join(" ")} 2>&1`,
      { encoding: "utf8", cwd: process.cwd() }
    );
    const p = out.match(/# pass (\d+)/);
    const f = out.match(/# fail (\d+)/);
    return { pass: parseInt(p?.[1] ?? "0"), fail: parseInt(f?.[1] ?? "0") };
  } catch (e: any) {
    const out = e.stdout ?? "";
    const p = out.match(/# pass (\d+)/);
    const f = out.match(/# fail (\d+)/);
    return { pass: parseInt(p?.[1] ?? "0"), fail: parseInt(f?.[1] ?? "0") };
  }
}

// Baseline
const baseline = runTests();
console.log(`Baseline: pass=${baseline.pass} fail=${baseline.fail}\n`);

const results: { label: string; applied: boolean; pass: number; fail: number }[] = [];

for (const m of mutations) {
  // reset to original
  fs.writeFileSync("lib/classify.ts", ORIGINAL);
  const applied = ORIGINAL.includes(m.find);
  if (!applied) {
    results.push({ label: m.label + " [PATTERN NOT FOUND]", applied: false, pass: 0, fail: 0 });
    continue;
  }
  const mutated = ORIGINAL.replace(m.find, m.replace);
  fs.writeFileSync("lib/classify.ts", mutated);
  const r = runTests();
  results.push({ label: m.label, applied: true, pass: r.pass, fail: r.fail });
  console.log(`  ${m.label}: pass=${r.pass} fail=${r.fail}`);
}

// restore
fs.writeFileSync("lib/classify.ts", ORIGINAL);
console.log("\nRestored classify.ts");

console.log("\n=== SURVIVORS (no failing test) ===");
const survivors = results.filter((r) => r.applied && r.fail === 0);
for (const s of survivors) console.log(`  ${s.label}`);
console.log(`\nTotal mutations: ${mutations.length}`);
console.log(`Killed: ${results.filter(r => r.applied && r.fail > 0).length}`);
console.log(`Survived: ${survivors.length}`);
console.log(`Pattern not found: ${results.filter(r => !r.applied).length}`);
