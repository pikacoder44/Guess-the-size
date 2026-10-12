export interface User {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
}

export interface GoogleAuthPayload {
  credential?: string;
  email?: string;
  name?: string;
}

export type AuthMode = "login" | "register";
