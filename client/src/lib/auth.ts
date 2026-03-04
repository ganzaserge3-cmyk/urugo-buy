import { useAuth } from "@/hooks/use-auth";

export async function authFetch(url: string, init: RequestInit = {}) {
  const token = useAuth.getState().token;
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}
