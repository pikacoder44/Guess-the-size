export interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  profilePicture?: string;
  googleId?: string;
  emailVerified?: boolean;
  givenName?: string;
  familyName?: string;
  locale?: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string | null;
  avatarUrl?: string | null;
  profilePicture?: string | null;
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
  access_token?: string;
  email?: string;
  name?: string;
}

export type AuthMode = "login" | "register";
