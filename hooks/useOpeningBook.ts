// hooks/useOpeningBook.ts
"use client";

import { useEffect, useState } from "react";
import type { Opening, OpeningBook } from "@/lib/types";
import { normaliseFenForOpening } from "@/lib/chess-helpers";

type UseOpeningBookResult = {
  /** The opening book, or null while it is loading. */
  book: OpeningBook | null;
  /** The opening matched to the current FEN, or null if none matched. */
  opening: Opening | null;
};

/**
 * Loads the opening book once and returns the opening matching the given
 * FEN. Updates automatically whenever the FEN changes.
 */
export function useOpeningBook(fen: string): UseOpeningBookResult {
  const [book, setBook] = useState<OpeningBook | null>(null);
  const [opening, setOpening] = useState<Opening | null>(null);

  // Load the book once.
  useEffect(() => {
    let cancelled = false;

    fetch("/openings.json")
      .then((r) => r.json())
      .then((data: OpeningBook) => {
        if (!cancelled) setBook(data);
      })
      .catch(() => {
        if (!cancelled) setBook(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Match the opening whenever the FEN or the book changes.
  useEffect(() => {
    if (!book) return;
    const key = normaliseFenForOpening(fen);
    setOpening(book[key] ?? null);
  }, [book, fen]);

  return { book, opening };
}
