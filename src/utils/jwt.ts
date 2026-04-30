// Lightweight JWT helpers — decode the payload only (we don't verify signatures
// client-side; the server is the source of truth).

interface JwtPayload {
  exp?: number; // expiry in seconds since epoch
  iat?: number;
  [key: string]: unknown;
}

const base64UrlDecode = (str: string): string => {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof atob === 'function') return atob(base64);
  // Node fallback (shouldn't trigger in RN/web, but safe)
  return Buffer.from(base64, 'base64').toString('binary');
};

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
};

// Returns true if the token expires within `bufferSeconds` (default 60s).
// If exp is missing or unparseable, returns false (don't refresh blindly).
export const isTokenExpiringSoon = (token: string, bufferSeconds = 60): boolean => {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - nowSeconds < bufferSeconds;
};
