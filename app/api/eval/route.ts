// app/api/eval/route.ts
import { Stockfish } from "@se-oss/stockfish";
import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { SerialQueue, QueueFullError } from "@/lib/serial-queue";
import { createEngineHolder } from "@/lib/engine-holder";
import { withTimeout, TimeoutError } from "@/lib/with-timeout";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANALYZE_TIMEOUT_MS = 6000;
const MAX_DEPTH = 18;
const MIN_DEPTH = 4;
const MAX_PENDING = 8;

const queue = new SerialQueue({ maxPending: MAX_PENDING });

let lastEngineInitMs: number | null = null;

const holder = createEngineHolder(
  async () => {
    const t0 = Date.now();
    const engine = new Stockfish();
    await engine.waitReady();
    lastEngineInitMs = Date.now() - t0;
    return engine;
  },
  (engine) => {
    try {
      engine.terminate();
    } catch {
      /* ignore */
    }
  }
);

function sideToMove(fen: string): "w" | "b" {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

function scoreToWhitePerspective(
  score: { type: "cp" | "mate"; value: number },
  fen: string
): { type: "cp" | "mate"; value: number } {
  const multiplier = sideToMove(fen) === "w" ? 1 : -1;
  return { type: score.type, value: score.value * multiplier };
}

type EvalRequest = {
  fen?: string;
  depth?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvalRequest;
    const fen = body.fen;
    const depth = body.depth ?? 12;

    if (!fen) {
      return NextResponse.json({ error: "FEN required" }, { status: 400 });
    }

    if (
      typeof depth !== "number" ||
      !Number.isInteger(depth) ||
      depth < MIN_DEPTH ||
      depth > MAX_DEPTH
    ) {
      return NextResponse.json(
        { error: `depth must be an integer between ${MIN_DEPTH} and ${MAX_DEPTH}` },
        { status: 400 }
      );
    }

    try {
      new Chess(fen);
    } catch {
      return NextResponse.json({ error: "Invalid FEN" }, { status: 400 });
    }

    if (req.signal.aborted) {
      return NextResponse.json({ error: "Aborted" }, { status: 400 });
    }

    const analysis = await queue.run(async () => {
      if (req.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      return await holder.run(async (engine) => {
        return await withTimeout(
          () => engine.analyze(fen, depth, 2),
          ANALYZE_TIMEOUT_MS
        );
      });
    });

    const lines = analysis.lines ?? [];
    const primary = lines[0]?.score ?? { type: "cp" as const, value: 0 };
    const secondary = lines[1]?.score ?? null;

    return NextResponse.json({
      bestmove: analysis.bestmove || null,
      score: scoreToWhitePerspective(primary, fen),
      secondScore: secondary
        ? scoreToWhitePerspective(secondary, fen)
        : null,
      _debug: { engineInitMs: lastEngineInitMs },
    });
  } catch (error: unknown) {
    if (error instanceof TimeoutError) {
      return NextResponse.json(
        { error: "Analysis timed out" },
        { status: 504 }
      );
    }

    if (error instanceof QueueFullError) {
      return NextResponse.json(
        { error: "Server busy, try again" },
        { status: 503, headers: { "Retry-After": "2" } }
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Aborted" }, { status: 400 });
    }

    console.error("[api/eval] Unexpected error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
