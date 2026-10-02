// tests/mutation-sweep.ts
import { execSync } from "node:child_process";
import fs from "node:fs";

const ORIGINAL = fs.readFileSync("lib/classify.ts", "utf8");

type Mut = { label: string; find: string; replace: string };

const mutations: Mut[] = [
  { label: "Miss bigLoss 1500 -> 2500", find: "MISS_BIG_LOSS = 1500", replace: "MISS_BIG_LOSS = 2500" },
  { label: "Miss gaveItAway 5500 -> 6500", find: "MISS_GAVE_IT_AWAY = 5500", replace: "MISS_GAVE_IT_AWAY = 6500" },
  { label: "Miss wasWinning 7000 -> 8000", find: "MISS_WAS_WINNING = 7000", replace: "MISS_WAS_WINNING = 8000" },
  { label: "Miss prevOpp 1000 -> 2000", find: "MISS_PREV_OPP_BLUNDER = 1000", replace: "MISS_PREV_OPP_BLUNDER = 2000" },
  { label: "Miss stillNotLosing 3000 -> 4000", find: "MISS_STILL_NOT_LOSING = 3000", replace: "MISS_STILL_NOT_LOSING = 4000" },
  { label: "Brilliant epAfter 5000 -> 6000", find: "BRILLIANT_EP_AFTER_MIN = 5000", replace: "BRILLIANT_EP_AFTER_MIN = 6000" },
  { label: "Brilliant epBefore 9000 -> 8000", find: "BRILLIANT_EP_BEFORE_MAX = 9000", replace: "BRILLIANT_EP_BEFORE_MAX = 8000" },
  { label: "Great gap 1000 -> 1500", find: "GREAT_GAP_MIN = 1000", replace: "GREAT_GAP_MIN = 1500" },
  { label: "Great crossesWin 7000 -> 7500", find: "GREAT_CROSSES_WIN = 7000", replace: "GREAT_CROSSES_WIN = 7500" },
  { label: "Great crossesLoss 3000 -> 3500", find: "GREAT_CROSSES_LOSS = 3000", replace: "GREAT_CROSSES_LOSS = 3500" },
  { label: "Excellent 200 -> 300", find: "EXCELLENT_MAX = 200", replace: "EXCELLENT_MAX = 300" },
  { label: "Good 500 -> 600", find: "GOOD_MAX = 500", replace: "GOOD_MAX = 600" },
  { label: "Inaccuracy 1000 -> 1100", find: "INACCURACY_MAX = 1000", replace: "INACCURACY_MAX = 1100" },
  { label: "Mistake 2000 -> 2100", find: "MISTAKE_MAX = 2000", replace: "MISTAKE_MAX = 2100" },
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

const baseline = runTests();
console.log(`Baseline: pass=${baseline.pass} fail=${baseline.fail}\n`);

const results: { label: string; applied: boolean; pass: number; fail: number }[] = [];

for (const m of mutations) {
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

fs.writeFileSync("lib/classify.ts", ORIGINAL);
console.log("\nRestored classify.ts");

console.log("\n=== SURVIVORS (no failing test) ===");
const survivors = results.filter((r) => r.applied && r.fail === 0);
for (const s of survivors) console.log(`  ${s.label}`);
console.log(`\nTotal mutations: ${mutations.length}`);
console.log(`Killed: ${results.filter(r => r.applied && r.fail > 0).length}`);
console.log(`Survived: ${survivors.length}`);
console.log(`Pattern not found: ${results.filter(r => !r.applied).length}`);
