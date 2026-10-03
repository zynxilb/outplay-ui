// lib/concurrency.ts
/**
 * Run async tasks with a concurrency limit.
 * - Results are in the same order as `items`.
 * - First error (by time) stops new tasks; waits for in-flight; rethrows.
 * - If `signal` aborts, rejects with AbortError (no new tasks started).
 */
export async function mapWithConcurrency<T, R>(
  _items: T[],
  _limit: number,
  _fn: (item: T, index: number, signal?: AbortSignal) => Promise<R>,
  _signal?: AbortSignal
): Promise<R[]> {
  throw new Error("mapWithConcurrency is not implemented");
}
