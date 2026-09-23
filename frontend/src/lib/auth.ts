import { API_BASE_URL } from './api';
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type UserRole = 'Professor' | 'Student' | 'Admin' | string;

export type AuthSession = AuthTokens & {
  role: UserRole;
};

type StoredToken = {
  value: string;
  expiresAt: number; // epoch ms
};

const STORAGE_KEYS = {
  access: 'iknow.auth.access',
  refresh: 'iknow.auth.refresh',
  role: 'iknow.auth.role',
} as const;

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // ~1 month (30 days)

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredToken(key: string): StoredToken | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredToken;
    if (!parsed?.value || typeof parsed.expiresAt !== 'number') {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() >= parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeStoredToken(key: string, value: string, ttlMs: number) {
  if (!isBrowser()) return;
  const payload: StoredToken = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function setAuthTokens(tokens: AuthTokens) {
  writeStoredToken(STORAGE_KEYS.access, tokens.accessToken, ACCESS_TOKEN_TTL_MS);
  writeStoredToken(STORAGE_KEYS.refresh, tokens.refreshToken, REFRESH_TOKEN_TTL_MS);
}

export function setUserRole(role: UserRole) {
  // Keep role TTL aligned with access token TTL.
  writeStoredToken(STORAGE_KEYS.role, role, ACCESS_TOKEN_TTL_MS);
}

export function getAccessToken(): string | null {
  return readStoredToken(STORAGE_KEYS.access)?.value ?? null;
}

export function getRefreshToken(): string | null {
  return readStoredToken(STORAGE_KEYS.refresh)?.value ?? null;
}

export function getUserRole(): UserRole | null {
  return readStoredToken(STORAGE_KEYS.role)?.value ?? null;
}

export function clearAuthTokens() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.access);
  window.localStorage.removeItem(STORAGE_KEYS.refresh);
  window.localStorage.removeItem(STORAGE_KEYS.role);
}

export async function login(params: { email: string; password: string }): Promise<AuthSession> {
  const baseUrl = API_BASE_URL;

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      GenerateRefreshToken: true,
    }),
  });

  if (!response.ok) {
    let message = `Login failed (${response.status})`;
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = (await response.json()) as {
    token?: string;
    refreshToken?: string;
    role?: string;
  };

  const accessToken = data?.token;
  const refreshToken = data?.refreshToken;
  const role = data?.role;

  if (!accessToken || !refreshToken) {
    throw new Error('Login response did not contain tokens.');
  }

  const session: AuthSession = {
    accessToken,
    refreshToken,
    role: role ?? 'Student',
  };

  setAuthTokens(session);
  setUserRole(session.role);
  return session;
}
