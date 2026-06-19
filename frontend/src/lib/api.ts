import type { ApiErrorPayload } from "@/types/auth";

type RequestOptions = RequestInit & {
  redirectOn401?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  data?: ApiErrorPayload;
  

  constructor(message: string, status: number, data?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { headers, redirectOn401 = true, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await response.json()) as ApiErrorPayload) : undefined;

  if (!response.ok) {
    if (
      response.status === 401 &&
      redirectOn401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }

    throw new ApiError(payload?.message ?? "Request failed", response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (isJson) {
    return payload as T;
  }

  return (await response.text()) as T;
}
