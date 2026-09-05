export const normalizeHexColor = (color?: string): string => {
  if (!color) return "#3b82f6";
  if (/^#[0-9A-Fa-f]{6}$/i.test(color)) return color;
  const map: Record<string, string> = {
    primary: "#3b82f6", slate: "#64748b", blue: "#3b82f6", emerald: "#10b981",
    red: "#ef4444", amber: "#f59e0b", purple: "#8b5cf6", cyan: "#06b6d4",
  };
  return map[color.toLowerCase()] || "#3b82f6";
};

export { getFullImageUrl } from "../../../lib/news-api";
