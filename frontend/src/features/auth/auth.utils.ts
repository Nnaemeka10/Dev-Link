/**
 * Auth pages must never be a returnTo target - landing back on /login after
 * logging in would loop. Shared by the guard, the 401 handler and every
 * "sign in to continue" entry point.
 */
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function getSafeReturnTo(value: string | null | undefined): string {
  // Fallback to home if value is empty/null/undefined
  if (!value) {
    return "/";
  }

  // Prevent unsafe redirects (must start with "/" and not "//")
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  // Never bounce back into an auth page after authenticating.
  if (isAuthPath(value.split("?")[0])) {
    return "/";
  }

  return value;
}

export function withReturnTo(path: string, returnTo?: string | null): string {
  // Only append returnTo param if it's valid and not the default
  if (!returnTo || returnTo === "/") {
    return path;
  }

  // Prevent unsafe redirects
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return path;
  }

  if (isAuthPath(returnTo.split("?")[0])) {
    return path;
  }

  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

/**
 * The page the user is on right now (path + query), as a returnTo value.
 * Read from window.location inside event handlers/effects only - never
 * during render - so it stays SSR-safe and never forces a Suspense boundary.
 * Returns "/" on auth pages (nothing to return to).
 */
export function getCurrentReturnTo(): string {
  if (typeof window === "undefined") return "/";
  const { pathname, search } = window.location;
  if (isAuthPath(pathname)) return "/";
  return `${pathname}${search}`;
}