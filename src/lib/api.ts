import { auth } from "./firebase";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "api_error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    data?: T;
    error?: { message?: string; code?: string };
  };

  if (!response.ok) {
    throw new ApiError(
      payload.error?.message ?? "Não foi possível concluir a operação.",
      response.status,
      payload.error?.code ?? "api_error",
    );
  }

  return (payload.data ?? payload) as T;
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown = {}) {
  return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
}
