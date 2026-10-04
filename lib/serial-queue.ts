// lib/serial-queue.ts
export interface SerialQueueOptions {
  /** Max number of pending tasks waiting (not including the currently running one). */
  maxPending?: number;
}

export class QueueFullError extends Error {
  constructor(max: number) {
    super(`Queue is full (max ${max} pending)`);
    this.name = "QueueFullError";
  }
}

/**
 * Serialize async tasks on a single resource (e.g., a Stockfish instance).
 * Tasks run one at a time, in submission order.
 * If a task rejects, the chain continues (next tasks still run).
 * Optional maxPending rejects overflow with QueueFullError.
 *
 * "pending" means: submitted but not yet started (waiting in line).
 * The currently running task is NOT counted toward maxPending.
 */
export class SerialQueue {
  private chain: Promise<unknown> = Promise.resolve();
  private running = false;
  private pending = 0;
  private readonly maxPending?: number;

  constructor(options?: SerialQueueOptions) {
    this.maxPending = options?.maxPending;
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    if (this.running && this.maxPending !== undefined && this.pending >= this.maxPending) {
      return Promise.reject(new QueueFullError(this.maxPending));
    }

    if (this.running) {
      this.pending++;
    } else {
      this.running = true;
    }

    const result = this.chain.then(task, task);
    this.chain = result.then(
      () => { this.onTaskDone(); },
      () => { this.onTaskDone(); }
    ).catch(() => undefined);
    return result;
  }

  private onTaskDone(): void {
    if (this.pending > 0) {
      this.pending--;
    } else {
      this.running = false;
    }
  }
}
