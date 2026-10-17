import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

export interface UserRow {
  id: number;
  username: string;
  name?: string | null;
  email: string | null;
  password: string | null;
  google_id: string | null;
  github_id?: string | null;
  avatar_url: string | null;
  email_verified?: boolean | null;
  given_name?: string | null;
  family_name?: string | null;
  locale?: string | null;
  created_at: string;
  updated_at?: string;
}

export const JWT_FALLBACK_SECRET =
  "scaleguess-jwt-development-secret-key-change-in-production";

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || JWT_FALLBACK_SECRET;
}

export function signToken(userId: number, username: string): string {
  const secret = getJwtSecret();
  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    "7d") as jwt.SignOptions["expiresIn"];
  return jwt.sign({ userId, username }, secret, { expiresIn });
}

export function publicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    name: user.name || undefined,
    email: user.email || undefined,
    avatarUrl: user.avatar_url || undefined,
    profilePicture: user.avatar_url || undefined,
    googleId: user.google_id || undefined,
    githubId: user.github_id || undefined,
    emailVerified: Boolean(user.email_verified),
    givenName: user.given_name || undefined,
    familyName: user.family_name || undefined,
    locale: user.locale || undefined,
    createdAt: user.created_at,
  };
}

export function sanitizeUsername(raw: string): string {
  const clean = raw
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return clean || "Player";
}
