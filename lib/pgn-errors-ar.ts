// lib/pgn-errors-ar.ts
import { AnalysisError, isAbortError } from "./pgn-analysis.ts";
import { InvalidFenError, IllegalMoveError, NetworkError, ApiError } from "./pgn-errors.ts";

const GENERIC = "حصل خطأ غير متوقع، حاول تاني";

/**
 * Translate any error into a user-facing Arabic message.
 * Never exposes the original English message.
 */
export function toArabicError(err: unknown): string {
  // 1) Abort first
  if (isAbortError(err)) return "اتلغى التحليل";

  // 2) AnalysisError -> position-aware
  if (err instanceof AnalysisError) {
    if (err.positionIndex === 0) {
      return "فشل تحليل الوضع الابتدائي";
    }
    return `فشل تحليل النقلة رقم ${err.positionIndex}`;
  }

  // 3) Invalid FEN
  if (err instanceof InvalidFenError) {
    return "الـFEN في الـheaders مش صحيح";
  }

  // 4) Illegal move
  if (err instanceof IllegalMoveError) {
    return `نقلة غير قانونية رقم ${err.ply}: ${err.san}`;
  }

  // 5) API errors
  if (err instanceof ApiError) {
    if (err.status === 503 || err.status === 504) {
      return "السيرفر مشغول، حاول تاني بعد شوية";
    }
    return "حصل خطأ في الاتصال بالسيرفر، حاول تاني";
  }

  // 6) Network / fetch errors
  if (err instanceof NetworkError) {
    return "مشكلة في الاتصال، حاول تاني";
  }

  return GENERIC;
}
