// tests/with-timeout.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { withTimeout, TimeoutError } from "../lib/with-timeout.ts";

const sleep = <T>(ms: number, value: T): Promise<T> =>
  new Promise((r) => setTimeout(() => r(value), ms));

test("withTimeout: resolves with value before deadline", async () => {
  const r = await withTimeout(async () => "ok", 100);
  assert.equal(r, "ok");
});

test("withTimeout: rejects with TimeoutError when exceeded", async () => {
  await assert.rejects(
    withTimeout(() => sleep(100, "late"), 20),
    (e: Error) => e.name === "TimeoutError" && e instanceof TimeoutError
  );
});

test("withTimeout: passes original rejection", async () => {
  await assert.rejects(
    withTimeout(async () => { throw new Error("boom"); }, 100),
    /boom/
  );
});

test("withTimeout: late resolve after timeout is ignored (no unhandled)", async () => {
  let latePromise: Promise<string> | null = null;
  const wrapped = withTimeout(() => {
    latePromise = sleep(50, "late");
    return latePromise;
  }, 10);
  await assert.rejects(wrapped, (e: Error) => e.name === "TimeoutError");
  await latePromise;
  // reaching here means no unhandled rejection crashed the process
  assert.ok(true);
});
