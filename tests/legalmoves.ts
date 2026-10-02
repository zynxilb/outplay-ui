import { Chess } from "chess.js";

// Case 1: starting position
const start = new Chess();
console.log("Case 1 (start):", start.moves().length, "— expected 20");

// Case 2: forced move — white king h1 in check from rook h8,
// black bishop f3 covers g2. Only escape: Kg1.
const forcedFen = "k6r/8/8/8/8/5b2/8/7K w - - 0 1";
const forced = new Chess(forcedFen);
const moves = forced.moves();
console.log("Case 2 (forced):", moves.length, "— expected 1");
console.log("  moves:", moves.join(", "));
console.log("  isCheck:", forced.isCheck(), "isCheckmate:", forced.isCheckmate());

// Case 3: 5 rapid moves
const game = new Chess();
const moveList = ["e4", "e5", "Nf3", "Nc6", "Bb5"];
const counts: number[] = [];
for (const m of moveList) {
  const before = new Chess(game.fen());
  counts.push(before.moves().length);
  game.move(m);
}
console.log("Case 3 (5 moves, legalMoves per position):", counts.join(", "));
