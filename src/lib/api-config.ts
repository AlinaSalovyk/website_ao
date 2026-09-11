/**
 * Helper to get the correct API base URL for Server-Side Rendering (SSR).
 * In Node.js SSR runtime on Vercel, relative fetch URLs cause URL parsing errors.
 * This function ensures SSR fetches use the backend URL (default: http://141.145.200.204.nip.io:8280).
 */
export const getSsrApiBase = (): string => {
  const envUrl = (import.meta.env.INTERNAL_API_URL || import.meta.env.PUBLIC_API_URL || "").trim();
  if (envUrl) return envUrl;
  return "http://141.145.200.204.nip.io:8280";
};
