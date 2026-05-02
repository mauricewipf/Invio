export const DESKTOP_BACKEND_URL = "http://localhost:3000";
export const DESKTOP_SESSION_STORAGE_KEY = "invio_session";
const DESKTOP_SESSION_COOKIE = "invio_session";

export function isDesktopBuild(): boolean {
  return import.meta.env.VITE_DESKTOP_BUILD === "true";
}

export function getDesktopSessionToken(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(DESKTOP_SESSION_STORAGE_KEY) || "";
}

export function setDesktopSessionToken(token: string, maxAgeSeconds: number) {
  localStorage.setItem(DESKTOP_SESSION_STORAGE_KEY, token);
  document.cookie = `${DESKTOP_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function clearDesktopSessionToken() {
  localStorage.removeItem(DESKTOP_SESSION_STORAGE_KEY);
  document.cookie = `${DESKTOP_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export async function desktopApiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getDesktopSessionToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${DESKTOP_BACKEND_URL}${path}`, {
    ...init,
    headers,
  });
}
