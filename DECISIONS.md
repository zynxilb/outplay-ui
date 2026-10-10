# Decisions Log

## D001: Brilliant — epBefore cap removed (temporary)

**Date:** 2026-10
**Status:** TEMPORARY — needs negative-sample validation
**Related commits:** e69d31d (cap removed), 8a86ced (SEE-based sacrifice)

### Decision
Removed `epBefore < 9000` cap from Brilliant check in `lib/classify.ts`.
The cap is NOT restored (for now).

### Evidence (positive sample only)
- Game: Rotlewi–Rubinstein 1907 ("Rubinstein's Immortal")
- Depth: 12, via Vercel `/api/eval` (Stockfish 17.1 WASM)
- Total: 50 moves, 4 classified Brilliant

| Move | epBefore | Cap (9000) |
|------|----------|------------|
| 20...Ng4 (ply 40)  | 7552  | allows |
| 22...Rxc3 (ply 44) | 8378  | allows |
| 23...Rd2 (ply 46)  | 9526  | **WOULD BLOCK** |
| 25...Rh3 (ply 50)  | 10000 | **WOULD BLOCK** |

2 of 4 Brilliants had epBefore ≥ 9000 → cap was blocking real sacrifices.

### Negative sample (validated 2026-10)
- Game: indense10 (1141) vs 163x (1074), Chess.com rapid
- Ordinary game, no famous sacrifices; Black blundered once
- Chess.com analysis: 1 Brilliant (White, 34.Rxg7), 0 Brilliant (Black)
- Outplay result: 1 Brilliant (34.Rxg7, White), 0 Brilliant (Black) → **exact match**
- Fixture: `tests/fixtures/indense10-game.json` (72 evals, depth 12)
- Test: `tests/indense10-fixture.test.ts`

### Known gap (remaining)
- **Only 1 negative sample.** Suggest testing 1-2 more before final call.
- The `epBefore >= 9000` Brilliants were not observed in this negative sample
  (34.Rxg7 had epBefore < 9000), so cap would not have triggered here either.
- Missing: a negative sample where a false positive with epBefore >= 9000
  would have been prevented by the cap. Not yet found.

### Review trigger (updated)
- After 2-3 total ordinary games, re-evaluate.

### Alternatives (deferred)
- **Safety cap at 9900**: rejected because it would still block ply 50 (epBefore=10000).
- **Safety cap on mate scores only**: ply 50 has score = `mate -5` → would be blocked.
  Not acceptable.
- **"Only move" check**: use `secondScore` to disallow Brilliant when an alternative
  also wins. Deferred until after negative sample.

### Non-determinism note
- Same game, two captures (live API vs fixture capture) produced different epBefore:
  - Ng4:  7552 vs 7166 (Δ 386)
  - Rxc3: 8378 vs 7525 (Δ 853)
  - Rd2:  9526 vs 9558 (Δ 32)
- Cause: Stockfish 17.1 WASM multi-threaded + MultiPV, depth 12.
- Impact: fixture evals are frozen; live results may vary run-to-run.
- TODO: consider single-thread + hash reset for reproducibility, or eval caching.

### Related artifacts
- `tests/fixtures/rubinstein-evals.json` — 51 captured evals (depth 12, Vercel production)
- `tests/rubinstein-fixture.test.ts` — offline re-verification
- `tests/sacrifice-detector.test.ts` — 6 unit tests, 2 documented limitations (en passant, Be6)
