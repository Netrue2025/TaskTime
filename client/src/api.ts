export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "include", ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new ApiError(body.error || "Request failed", response.status); }
  return response.status === 204 ? undefined as T : response.json();
}
