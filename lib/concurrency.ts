// lib/concurrency.ts
/**
 * Run async tasks with a concurrency limit.
 * - Results are in the same order as `items`.
 * - First error (by time) stops new tasks; waits for in-flight; rethrows.
 * - If `signal` aborts, rejects with AbortError (no new tasks started).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number, signal?: AbortSignal) => Promise<R>,
  signal?: AbortSignal
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }

  const results: R[] = new Array(items.length);
  if (items.length === 0) return results;

  const makeAbortError = (): Error =>
    signal?.reason instanceof Error
      ? signal.reason
      : new DOMException("Aborted", "AbortError");

  if (signal?.aborted) throw makeAbortError();

  let nextIndex = 0;
  let failed = false;
  let firstError: unknown = undefined;

  const worker = async (): Promise<void> => {
    while (true) {
      if (failed) return;
      if (signal?.aborted) {
        if (!failed) {
          failed = true;
          firstError = makeAbortError();
        }
        return;
      }
      const i = nextIndex++;
      if (i >= items.length) return;

      try {
        results[i] = await fn(items[i], i, signal);
      } catch (err) {
        if (!failed) {
          failed = true;
          firstError = err;
        }
        return;
      }
    }
  };

  const workerCount = Math.min(limit, items.length);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) workers.push(worker());

  await Promise.allSettled(workers);

  if (failed) throw firstError;
  return results;
}
