// tests/concurrency.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mapWithConcurrency } from "../lib/concurrency.ts";

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

test("mapWithConcurrency: preserves input order (first slowest)", async () => {
  const items = [0, 1, 2, 3, 4];
  // First item slowest -> completion order reversed -> results still in order
  const delays = [50, 40, 30, 20, 10];
  const results = await mapWithConcurrency(items, 5, async (item) => {
    await sleep(delays[item]);
    return item * 10;
  });
  assert.deepEqual(results, [0, 10, 20, 30, 40]);
});

test("mapWithConcurrency: limit caps in-flight at exactly N", async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const items = Array.from({ length: 12 }, (_, i) => i);
  await mapWithConcurrency(items, 3, async () => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      await sleep(20);
    } finally {
      inFlight--;
    }
  });
  assert.equal(maxInFlight, 3);
});

test("mapWithConcurrency: first error by time stops new tasks", async () => {
  const started: number[] = [];
  let inflightSlowFinished = false;

  const items = [0, 1, 2, 3, 4];
  const promise = mapWithConcurrency(items, 3, async (item) => {
    started.push(item);
    if (item === 1) {
      await sleep(10);
      throw new Error("boom-1");
    }
    if (item === 2) {
      await sleep(40);
      inflightSlowFinished = true;
      return "slow-2";
    }
    await sleep(5);
    return `ok-${item}`;
  });

  await assert.rejects(promise, /boom-1/);

  // Item 2 was in-flight when 1 errored; must have finished.
  assert.equal(inflightSlowFinished, true);
  // No new items (3 or 4) started after error.
  assert.deepEqual(started.sort(), [0, 1, 2]);
});

test("mapWithConcurrency: abort before start rejects with AbortError", async () => {
  const ac = new AbortController();
  ac.abort();
  let called = 0;
  await assert.rejects(
    mapWithConcurrency([1, 2, 3], 2, async () => { called++; return 0; }, ac.signal),
    (err: Error) => err.name === "AbortError"
  );
  assert.equal(called, 0);
});

test("mapWithConcurrency: abort mid-flight rejects with AbortError", async () => {
  const ac = new AbortController();
  const items = [0, 1, 2, 3, 4];
  const started: number[] = [];

  const promise = mapWithConcurrency(
    items,
    2,
    async (item) => {
      started.push(item);
      await sleep(30);
      return item;
    },
    ac.signal
  );

  // Let first batch start, then abort.
  await sleep(5);
  ac.abort();

  await assert.rejects(
    promise,
    (err: Error) => err.name === "AbortError"
  );
  // Only the first in-flight batch started.
  assert.ok(started.length <= 2);
});

test("mapWithConcurrency: invalid limit throws RangeError", async () => {
  for (const bad of [0, -1, NaN, 1.5]) {
    await assert.rejects(
      mapWithConcurrency([1, 2, 3], bad, async () => 0),
      (err: Error) => err.name === "RangeError"
    );
  }
});
