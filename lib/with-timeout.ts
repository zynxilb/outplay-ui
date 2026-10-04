// lib/with-timeout.ts
export class TimeoutError extends Error {
  constructor(_ms: number) {
    super("not implemented");
    throw new Error("TimeoutError not implemented");
  }
}

export function withTimeout<T>(
  _fn: () => Promise<T>,
  _ms: number
): Promise<T> {
  throw new Error("withTimeout is not implemented");
}
