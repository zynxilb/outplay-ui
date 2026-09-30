import { Stockfish } from "@se-oss/stockfish";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

type EvalRequest = {
  fen?: string;
  depth?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvalRequest;
    const { fen, depth = 10 } = body;

    if (!fen) {
      return NextResponse.json({ error: "FEN مطلوب" }, { status: 400 });
    }

    const engine = new Stockfish();
    await engine.waitReady();
    const analysis = await engine.analyze(fen, depth);
    engine.terminate();

    return NextResponse.json({
      bestmove: analysis.bestmove,
      score: analysis.lines?.[0]?.score ?? { type: "cp", value: 0 },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "فشل التحليل";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
