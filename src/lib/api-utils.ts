/**
 * API Utilities for safe data handling
 */

/**
 * Safely parses JSON from a Response or Request object without throwing on empty bodies.
 */
export async function safeJsonParse<T = any>(source: Response | Request): Promise<T> {
  try {
    const text = await source.text();
    return text ? JSON.parse(text) : {} as T;
  } catch (error) {
    console.error('Safe JSON Parse Error:', error);
    return {} as T;
  }
}

/**
 * A robust fetch wrapper that includes safe JSON parsing.
 */
export async function robustFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ data: T; ok: boolean; status: number; res: Response }> {
  try {
    const res = await fetch(input, init);
    const data = await safeJsonParse<T>(res);
    return { data, ok: res.ok, status: res.status, res };
  } catch (error: any) {
    console.error('Robust Fetch Error:', error);
    return {
      data: { error: error.message || 'Network error' } as any,
      ok: false,
      status: 500,
      res: new Response(null, { status: 500 })
    };
  }
}
