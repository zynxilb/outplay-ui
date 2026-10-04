// lib/serial-queue.ts
/**
 * Serialize async tasks on a single resource (e.g., a Stockfish instance).
 * Tasks run one at a time, in submission order.
 * If a task rejects, the chain continues (next tasks still run).
 */
export class SerialQueue {
  private chain: Promise<unknown> = Promise.resolve();

  run<T>(_task: () => Promise<T>): Promise<T> {
    throw new Error("SerialQueue.run is not implemented");
  }
}
