// tests/engine-holder.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createEngineHolder } from "../lib/engine-holder.ts";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

test("engine-holder: factory called once for multiple sequential runs", async () => {
  let calls = 0;
  const holder = createEngineHolder(
    async () => ({ id: ++calls }),
    () => {}
  );
  const r1 = await holder.run(async (e) => e.id);
  const r2 = await holder.run(async (e) => e.id);
  assert.equal(r1, 1);
  assert.equal(r2, 1);
  assert.equal(calls, 1);
});

test("engine-holder: failed run disposes and next run gets new engine", async () => {
  let calls = 0;
  const disposed: number[] = [];
  const holder = createEngineHolder(
    async () => ({ id: ++calls }),
    (e) => { disposed.push(e.id); }
  );

  await assert.rejects(
    holder.run(async () => { throw new Error("boom"); }),
    /boom/
  );
  assert.deepEqual(disposed, [1]);

  const r = await holder.run(async (e) => e.id);
  assert.equal(r, 2);
  assert.equal(calls, 2);
});

test("engine-holder: factory failure retried on next run", async () => {
  let calls = 0;
  const holder = createEngineHolder(
    async () => {
      calls++;
      if (calls === 1) throw new Error("init failed");
      return { id: calls };
    },
    () => {}
  );

  await assert.rejects(holder.run(async () => "unused"), /init failed/);

  const r = await holder.run(async (e) => e.id);
  assert.equal(r, 2);
  assert.equal(calls, 2);
});

test("engine-holder: dispose errors are swallowed", async () => {
  const holder = createEngineHolder(
    async () => ({ id: 1 }),
    () => { throw new Error("dispose boom"); }
  );

  await assert.rejects(
    holder.run(async () => { throw new Error("run boom"); }),
    /run boom/
  );
  // next run should still work
  const r = await holder.run(async (e) => e.id);
  assert.equal(r, 1); // same factory shape (id always 1)
});

test("engine-holder: late error from old engine doesn't reset new (identity)", async () => {
  let calls = 0;
  const disposed: number[] = [];
  const holder = createEngineHolder(
    async () => ({ id: ++calls }),
    (e) => { disposed.push(e.id); }
  );

  // A: gets engine1, fails at 30ms
  const aP = holder.run(async () => {
    await sleep(30);
    throw new Error("A failed");
  });

  // B: joins same in-flight promise, fails at 60ms
  const bP = holder.run(async () => {
    await sleep(60);
    throw new Error("B failed");
  });

  await assert.rejects(aP, /A failed/);
  assert.deepEqual(disposed, [1]);

  // C: starts after A, gets engine2
  const cResult = await holder.run(async (e) => e.id);
  assert.equal(cResult, 2);
  assert.equal(calls, 2);

  // B fails now → identity check fails → don't dispose engine2
  await assert.rejects(bP, /B failed/);
  assert.deepEqual(disposed, [1]);
});
