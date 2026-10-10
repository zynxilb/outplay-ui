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

### Known gap
- **No negative sample tested.** All games were famous-attacking games.
- The cap may have been protecting against false positives in ordinary games.
- Cannot yet conclude that removing the cap is strictly better.

### Review trigger
- After testing 2-3 ordinary games (preferably with one side heavily winning),
  count Brilliants with epBefore ≥ 9000 and manually verify each.

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
