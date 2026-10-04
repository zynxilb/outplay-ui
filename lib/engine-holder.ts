// lib/engine-holder.ts
export interface EngineHolder<E> {
  run<T>(fn: (engine: E) => Promise<T>): Promise<T>;
  reset(): void;
}

export function createEngineHolder<E>(
  _factory: () => Promise<E>,
  _dispose: (engine: E) => void
): EngineHolder<E> {
  throw new Error("createEngineHolder is not implemented");
}
