import type { Session } from "./types";
const KEY = "showpass-session";
export function getSession(): Session | null {
  try {
    const session = JSON.parse(
      sessionStorage.getItem(KEY) || "null",
    ) as Session | null;
    if (
      session &&
      typeof session.token === "string" &&
      typeof session.userId === "string" &&
      session.expiresAt > Date.now()
    )
      return session;
  } catch {
    /* Ignore corrupt or unavailable browser storage. */
  }
  return null;
}
export function storeSession(token: string, email: string): Session {
  const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const claims = JSON.parse(atob(encoded));
  const session = {
    token,
    email,
    userId: claims.sub as string,
    expiresAt: Number(claims.exp) * 1000,
  };
  sessionStorage.setItem(KEY, JSON.stringify(session));
  return session;
}
export function clearSession() {
  sessionStorage.removeItem(KEY);
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const session = getSession();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "Unable to reach Showpass. Check your connection and try again.",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      if (session && !path.startsWith("/auth/"))
        window.dispatchEvent(new Event("showpass-session-expired"));
      throw new ApiError(
        401,
        path.startsWith("/auth/")
          ? "Email or password is incorrect."
          : "Your session has expired. Please sign in again.",
      );
    }
    throw new ApiError(
      response.status,
      body?.error ||
        (response.status === 403
          ? "You do not have permission to do that."
          : "Something went wrong. Please try again."),
    );
  }
  return body as T;
}
