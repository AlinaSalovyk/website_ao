/**
 * @module strapi/StrapiHttpClient
 *
 * Low-level HTTP client for the Strapi REST API.
 *
 * Responsibilities (SRP):
 *  - Build the full URL from base + endpoint + query
 *  - Attach the Bearer token when available
 *  - Handle network errors and non-2xx responses gracefully
 *  - Return typed JSON or null on failure
 *
 * This class knows nothing about articles, slugs, or domain logic.
 * It is the single place where fetch() is called.
 */

import type { StrapiListResponse } from './types';


export class StrapiHttpClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash
    this.token = token;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildUrl(endpoint: string, params?: URLSearchParams): string {
    const query = params?.toString();
    return `${this.baseUrl}/api/${endpoint}${query ? `?${query}` : ''}`;
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(url: string): Promise<T | null> {
    let res: Response;

    try {
      res = await fetch(url, { headers: this.buildHeaders() });
    } catch (cause) {
      // Network error — Strapi is unreachable (not started, wrong URL, etc.)
      console.warn(`[StrapiHttpClient] Network error fetching ${url}:`, cause);
      return null;
    }

    if (!res.ok) {
      console.warn(
        `[StrapiHttpClient] ${res.status} ${res.statusText} — ${url}`,
      );
      return null;
    }

    try {
      return (await res.json()) as T;
    } catch (cause) {
      console.warn(`[StrapiHttpClient] Failed to parse JSON from ${url}:`, cause);
      return null;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Fetch a collection endpoint.
   * Returns an empty array when Strapi is unavailable.
   */
  async getMany<T>(
    endpoint: string,
    params?: URLSearchParams,
  ): Promise<T[]> {
    const url = this.buildUrl(endpoint, params);
    const json = await this.request<StrapiListResponse<T>>(url);
    return json?.data ?? [];
  }

  /**
   * Fetch a single-item endpoint (e.g. filtered by slug).
   * Returns undefined when not found or Strapi is unavailable.
   */
  async getOne<T>(
    endpoint: string,
    params?: URLSearchParams,
  ): Promise<T | undefined> {
    const url = this.buildUrl(endpoint, params);
    const json = await this.request<StrapiListResponse<T>>(url);
    // Strapi filter returns a list — take the first match
    const item = json?.data?.[0];
    return item ?? undefined;
  }
}
