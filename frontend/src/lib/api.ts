/**
 * Base URL of the iknow-api backend.
 *
 * Set NEXT_PUBLIC_API_BASE_URL in .env.local to point at a local API run
 * (see .env.example). The faculty database is only reachable through the SSH
 * tunnel on the developer machine, so the deployed backend cannot read it -
 * working against real data means running iknow-api locally.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://iknow-api.onrender.com';

/** Builds an absolute API URL from a path such as `/api/user/getUser`. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
