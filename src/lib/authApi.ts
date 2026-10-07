import type { AuthResponse, GoogleAuthPayload, LoginPayload, RegisterPayload, User } from "../types/auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export class AuthApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.error || (res.status === 401 ? "Invalid credentials." : "An unexpected error occurred.");
    throw new AuthApiError(errorMsg, res.status);
  }
  return data as T;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: payload.username.trim(),
      password: payload.password,
    }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: payload.username.trim(),
      password: payload.password,
    }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function googleLogin(payload: GoogleAuthPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse<{ user: User }>(res);
  return data.user;
}

/**
 * Client-side validation matching backend server rules:
 * - username: 1–32 characters, alphanumeric, underscores, hyphens only
 * - password: minimum 4 characters
 */
export function validateUsername(username: string): string | null {
  const clean = username.trim();
  if (!clean) return "Username is required.";
  if (clean.length > 32) return "Username must be 32 characters or fewer.";
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return "Username may only contain letters, numbers, underscores, and hyphens.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 4) return "Password must be at least 4 characters.";
  return null;
}
