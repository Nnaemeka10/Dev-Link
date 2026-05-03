export function getSafeReturnTo(value: string | null | undefined): string {
  // Fallback to home if value is empty/null/undefined
  if (!value) {
    return "/";
  }

  // Prevent unsafe redirects (must start with "/" and not "//")
  if (!value.startsWith("/") || value.startsWith("//")) {
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

  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}
