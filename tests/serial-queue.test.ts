// tests/serial-queue.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SerialQueue } from "../lib/serial-queue.ts";

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

test("SerialQueue: preserves submission order", async () => {
  const q = new SerialQueue();
  const order: number[] = [];
  await Promise.all([
    q.run(async () => { order.push(1); }),
    q.run(async () => { order.push(2); }),
    q.run(async () => { order.push(3); }),
  ]);
  assert.deepEqual(order, [1, 2, 3]);
});

test("SerialQueue: tasks do not overlap", async () => {
  const q = new SerialQueue();
  let inFlight = 0;
  let maxInFlight = 0;
  const tasks = Array.from({ length: 5 }, () =>
    q.run(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await sleep(20);
      inFlight--;
    })
  );
  await Promise.all(tasks);
  assert.equal(maxInFlight, 1);
});

test("SerialQueue: returns each task's value", async () => {
  const q = new SerialQueue();
  const r1 = q.run(async () => "a");
  const r2 = q.run(async () => "b");
  assert.equal(await r1, "a");
  assert.equal(await r2, "b");
});

test("SerialQueue: a rejected task does not stop the chain", async () => {
  const q = new SerialQueue();
  const order: string[] = [];
  const p1 = q.run(async () => { order.push("1"); throw new Error("boom-1"); });
  const p2 = q.run(async () => { order.push("2"); return "ok-2"; });
  const p3 = q.run(async () => { order.push("3"); return "ok-3"; });

  await assert.rejects(p1, /boom-1/);
  assert.equal(await p2, "ok-2");
  assert.equal(await p3, "ok-3");
  assert.deepEqual(order, ["1", "2", "3"]);
});

test("SerialQueue: rejection does not leak as unhandled", async () => {
  const q = new SerialQueue();
  const p = q.run(async () => { throw new Error("boom"); });
  await assert.rejects(p, /boom/);
  // queue still usable
  const r = await q.run(async () => "ok");
  assert.equal(r, "ok");
});
