// lib/serial-queue.ts
/**
 * Serialize async tasks on a single resource (e.g., a Stockfish instance).
 * Tasks run one at a time, in submission order.
 * If a task rejects, the chain continues (next tasks still run).
 */
export class SerialQueue {
  private chain: Promise<unknown> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.chain.then(task, task);
    // swallow result for the chain, but keep it for the caller
    this.chain = result.catch(() => undefined);
    return result;
  }
}
