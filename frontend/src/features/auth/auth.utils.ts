export function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function withReturnTo(path: string, returnTo: string | null) {
  const safeReturnTo = getSafeReturnTo(returnTo);
  return `${path}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}
