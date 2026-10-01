import { Stockfish } from "@se-oss/stockfish";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

type EvalRequest = {
  fen?: string;
  depth?: number;
};

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvalRequest;
    const { fen, depth = 12 } = body;

    if (!fen) {
      return NextResponse.json({ error: "FEN required" }, { status: 400 });
    }

    const engine = new Stockfish();
    await engine.waitReady();
    // Ask for the top 2 lines so we can detect "Great" moves.
    const analysis = await engine.analyze(fen, depth, 2);
    engine.terminate();

    const lines = analysis.lines ?? [];
    const primary = lines[0]?.score ?? { type: "cp" as const, value: 0 };
    const secondary = lines[1]?.score ?? null;

    return NextResponse.json({
      bestmove: analysis.bestmove ?? null,
      score: scoreToWhitePerspective(primary, fen),
      secondScore: secondary
        ? scoreToWhitePerspective(secondary, fen)
        : null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
