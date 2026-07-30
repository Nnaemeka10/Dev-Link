const BUSINESS_SUFFIXES = /\b(ltd|limited|inc|enterprises|nigeria|plc|co)\b/gi;

function sanitizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,\-']/g, ' ')
    .replace(BUSINESS_SUFFIXES, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Compares registered legal name against resolved bank account name.
 * Returns a score from 0.0 to 1.0. >= 0.85 is considered a match.
 */
export function matchIdentity(registeredName: string, resolvedName: string): number {
  const a = sanitizeName(registeredName);
  const b = sanitizeName(resolvedName);

  const tokensA = new Set(a.split(' ').filter(Boolean));
  const tokensB = new Set(b.split(' ').filter(Boolean));
  const overlap = [...tokensA].filter((t) => tokensB.has(t)).length;
  
  // Strong token overlap handles inverted name orders (e.g., "Musa Chidi Ola" vs "Ola Musa C")
  if (overlap >= 2) return 1; 

  return similarity(a, b); // fallback: normalized edit-distance ratio
}