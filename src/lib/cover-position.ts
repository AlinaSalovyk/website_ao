// WARNING: KEEP IN SYNC WITH BACKEND!
// 🔴 TRUTH: must stay exactly identical to the regex in:
// apps/backend/internal/presentation/http/news_handler.go

/**
 * Valid cover_position format:
 *   "X% Y%"  where X and Y are 0–100 (inclusive)
 *   OR one of: top | bottom | center | left | right
 *
 * The regex forbids values > 100 (e.g. "150% 50%" is rejected).
 */
export const COVER_POSITION_REGEX =
  /^((100|[1-9]?\d)%\s(100|[1-9]?\d)%|top|bottom|center|left|right)$/;

export const isValidCoverPosition = (pos: string): boolean => {
  if (!pos) return true; // empty = not set, defaults to "center" on the server
  return COVER_POSITION_REGEX.test(pos);
};
