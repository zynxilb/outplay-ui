import { Stockfish } from "@se-oss/stockfish";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

type EvalRequest = {
  fen?: string;
  depth?: number;
};

/** Extract the side-to-move letter ("w" or "b") from a FEN. */
function sideToMove(fen: string): "w" | "b" {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvalRequest;
    const { fen, depth = 12 } = body;

    if (!fen) {
      return NextResponse.json({ error: "FEN required" }, { status: 400 });
    }

    const engine = new Stockfish();
    await engine.waitReady();
    const analysis = await engine.analyze(fen, depth);
    engine.terminate();

    const rawScore = analysis.lines?.[0]?.score ?? { type: "cp", value: 0 };

    // UCI-style: score is from the side-to-move perspective.
    // Convert to White's perspective so the client can compare evals.
    const multiplier = sideToMove(fen) === "w" ? 1 : -1;

    return NextResponse.json({
      bestmove: analysis.bestmove ?? null,
      score: {
        type: rawScore.type,
        value: rawScore.value * multiplier,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
