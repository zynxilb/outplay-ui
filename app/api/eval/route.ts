import { Stockfish } from "@se-oss/stockfish";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const { fen, depth = 10 } = await req.json();

    if (!fen) {
      return NextResponse.json({ error: "FEN مطلوب" }, { status: 400 });
    }

    const engine = new Stockfish();
    await engine.waitReady();
    const analysis = await engine.analyze(fen, depth);
    engine.terminate();

    return NextResponse.json({
      bestmove: analysis.bestmove,
      score: analysis.lines?.[0]?.score || { type: "cp", value: 0 },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "فشل التحليل" },
      { status: 500 }
    );
  }
}
