// lib/engine-holder.ts
export interface EngineHolder<E> {
  run<T>(fn: (engine: E) => Promise<T>): Promise<T>;
  reset(): void;
}

/**
 * Lazily create one engine instance, reuse across runs.
 * - On failure of a run: dispose the engine and clear so the next run gets a new one.
 * - Identity guard: only reset if the failing run used the *current* engine
 *   (i.e., a late failure from an old engine does not kill a fresh one).
 * - Factory failure: reset so the next run retries.
 * - Dispose errors are swallowed.
 *
 * Note: this holder does NOT serialize concurrent runs — pair it with a
 * SerialQueue if the engine is single-threaded.
 */
export function createEngineHolder<E>(
  factory: () => Promise<E>,
  dispose: (engine: E) => void
): EngineHolder<E> {
  let enginePromise: Promise<E> | null = null;
  let currentEngine: E | null = null;

  function getEngine(): Promise<E> {
    if (!enginePromise) {
      const t0 = Date.now();
      enginePromise = factory().then(
        (e) => {
          console.log(`[engine-holder] init: ${Date.now() - t0}ms`);
          currentEngine = e;
          return e;
        },
        (err) => {
          enginePromise = null;
          currentEngine = null;
          throw err;
        }
      );
    }
    return enginePromise;
  }

  function safeDispose(engine: E): void {
    try {
      dispose(engine);
    } catch {
      // dispose errors must not propagate
    }
  }

  function resetFor(engine: E): void {
    if (currentEngine !== engine) return;
    const e = engine;
    currentEngine = null;
    enginePromise = null;
    safeDispose(e);
  }

  async function run<T>(fn: (engine: E) => Promise<T>): Promise<T> {
    const engine = await getEngine();
    try {
      return await fn(engine);
    } catch (err) {
      resetFor(engine);
      throw err;
    }
  }

  function reset(): void {
    if (currentEngine) {
      const e = currentEngine;
      currentEngine = null;
      enginePromise = null;
      safeDispose(e);
    } else {
      enginePromise = null;
    }
  }

  return { run, reset };
}
