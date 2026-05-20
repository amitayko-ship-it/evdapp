import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function fullUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = fullUrl(queryKey[0] as string);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "שגיאה בשרת" }));
    throw new Error(error.error || "שגיאה בשרת");
  }
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      queryFn: defaultQueryFn,
    },
  },
});

export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(fullUrl(url), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "שגיאה בשרת" }));
    throw new Error(error.error || "שגיאה בשרת");
  }
  return res.json();
}
