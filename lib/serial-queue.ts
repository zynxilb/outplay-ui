// lib/serial-queue.ts
/**
 * Serialize async tasks on a single resource (e.g., a Stockfish instance).
 * Tasks run one at a time, in submission order.
 * If a task rejects, the chain continues (next tasks still run).
 */
export interface SerialQueueOptions {
  maxPending?: number;
}

export class SerialQueue {
  private chain: Promise<unknown> = Promise.resolve();

  constructor(_options?: SerialQueueOptions) {
    throw new Error("SerialQueue constructor not implemented");
  }

  run<T>(_task: () => Promise<T>): Promise<T> {
    throw new Error("SerialQueue.run not implemented");
  }
}


export class QueueFullError extends Error {
  constructor(max: number) {
    super(`Queue is full (max ${max} pending)`);
    this.name = "QueueFullError";
  }
}
