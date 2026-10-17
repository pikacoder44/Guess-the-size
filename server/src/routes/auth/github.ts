import { Router, Request, Response } from "express";
import pool from "../../db.js";
import { UserRow, signToken, publicUser, sanitizeUsername } from "./utils.js";

const router = Router();

const githubClientId =
  process.env.GITHUB_CLIENT_ID ||
  process.env.CLIENT_ID ||
  process.env.VITE_GITHUB_CLIENT_ID ||
  "";

const githubClientSecret =
  process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET || "";

// ---------------------------------------------------------------------------
// GET /github (Initiate OAuth Redirect)
// ---------------------------------------------------------------------------
router.get("/github", (req: Request, res: Response): void => {
  if (!githubClientId) {
    res.status(400).json({
      error: "GITHUB_CLIENT_ID is not configured on the server.",
    });
    return;
  }

  const redirectUri =
    (typeof req.query.redirect_uri === "string" && req.query.redirect_uri) ||
    `${req.protocol}://${req.get("host")}/api/auth/github/callback`;

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    githubClientId,
  )}&scope=read:user,user:email&redirect_uri=${encodeURIComponent(redirectUri)}`;

  if (req.accepts("html")) {
    res.redirect(authUrl);
  } else {
    res.json({ url: authUrl });
  }
});

// ---------------------------------------------------------------------------
// GET /github/callback & GET /callback
// ---------------------------------------------------------------------------
export async function handleGitHubCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  const clientOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

  if (!code) {
    res.redirect(`${clientOrigin}/?auth_error=missing_github_code`);
    return;
  }

  // Redirect back to frontend with the authorization code parameter
  res.redirect(`${clientOrigin}/?code=${encodeURIComponent(code)}`);
}

// ---------------------------------------------------------------------------
// POST /github (or POST /)
// ---------------------------------------------------------------------------
/**
 * Verify GitHub OAuth credentials (via code exchange or access_token) and authenticate user.
 * Body: { code?: string, access_token?: string, mock?: boolean }
 */
export async function handleGitHubAuth(
  req: Request,
  res: Response,
): Promise<void> {
  const { code, access_token, mock } = req.body ?? {};

  let githubId: string | null = null;
  let username: string | null = null;
  let profileEmail: string | null = null;
  let profileName: string | null = null;
  let avatarUrl: string | null = null;

  try {
    let gitHubAccessToken =
      typeof access_token === "string" && access_token.trim()
        ? access_token.trim()
        : null;

    // 1. If authorization code is provided, exchange it for a GitHub access token
    if (!gitHubAccessToken && typeof code === "string" && code.trim()) {
      if (!githubClientId || !githubClientSecret) {
        console.warn(
          "[GitHub Auth] GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not configured in server environment.",
        );
      } else {
        const tokenRes = await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              client_id: githubClientId,
              client_secret: githubClientSecret,
              code: code.trim(),
            }),
          },
        );

        if (tokenRes.ok) {
          const tokenData = (await tokenRes.json()) as {
            access_token?: string;
            error?: string;
            error_description?: string;
          };

          if (tokenData.access_token) {
            gitHubAccessToken = tokenData.access_token;
          } else if (tokenData.error) {
            console.error(
              "[GitHub Auth] Token exchange failed:",
              tokenData.error_description || tokenData.error,
            );
            res.status(401).json({
              error:
                tokenData.error_description ||
                "Failed to exchange GitHub authorization code.",
            });
            return;
          }
        } else {
          res
            .status(401)
            .json({ error: "Unable to reach GitHub OAuth server." });
          return;
        }
      }
    }

    // 2. Query GitHub User API with access token
    if (gitHubAccessToken) {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${gitHubAccessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ScaleGuess-App",
        },
      });

      if (!userRes.ok) {
        res
          .status(401)
          .json({ error: "Failed to fetch user profile from GitHub API." });
        return;
      }

      const ghData = (await userRes.json()) as {
        id: number;
        login: string;
        name?: string | null;
        avatar_url?: string | null;
        email?: string | null;
      };

      githubId = String(ghData.id);
      username = ghData.login;
      profileName = ghData.name || ghData.login;
      avatarUrl = ghData.avatar_url || null;
      profileEmail = ghData.email ? ghData.email.trim().toLowerCase() : null;

      // If user's email is private, fetch from /user/emails
      if (!profileEmail) {
        try {
          const emailsRes = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${gitHubAccessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "ScaleGuess-App",
            },
          });

          if (emailsRes.ok) {
            const emails = (await emailsRes.json()) as Array<{
              email: string;
              primary: boolean;
              verified: boolean;
            }>;
            const primary =
              emails.find((e) => e.primary && e.verified) ||
              emails.find((e) => e.verified) ||
              emails[0];
            if (primary?.email) {
              profileEmail = primary.email.trim().toLowerCase();
            }
          }
        } catch (emailErr) {
          console.warn("[GitHub Auth] Could not retrieve private email:", emailErr);
        }
      }
    } else if (mock || !githubClientId || !githubClientSecret) {
      // 3. Fallback mock profile for local testing when GitHub App credentials are not yet configured in .env
      console.log(
        "[GitHub Auth] Using fallback GitHub Explorer profile (development/testing mode).",
      );
      githubId = "gh_demo_9919";
      username = "github_explorer";
      profileName = "GitHub Explorer";
      profileEmail = "explorer+github@scale.app";
      avatarUrl = "https://avatars.githubusercontent.com/u/9919?v=4";
    } else {
      res.status(400).json({
        error: "GitHub authorization code or access token is required.",
      });
      return;
    }

    if (!githubId) {
      res.status(400).json({ error: "Unable to retrieve GitHub user identity." });
      return;
    }

    let user: UserRow | undefined;

    // 4. Search by verified githubId
    const { rows: idRows } = await pool.query<UserRow>(
      "SELECT * FROM users WHERE github_id = $1",
      [githubId],
    );
    user = idRows[0];

    if (user) {
      const { rows: updatedRows } = await pool.query<UserRow>(
        `UPDATE users
         SET name = COALESCE($1, name),
             avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN $2 ELSE avatar_url END,
             email = COALESCE($3, email),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [profileName, avatarUrl, profileEmail, user.id],
      );
      user = updatedRows[0] || user;
    }

    // 5. If not found by github_id, check by verified email
    if (!user && profileEmail) {
      const { rows: emailRows } = await pool.query<UserRow>(
        "SELECT * FROM users WHERE email IS NOT NULL AND LOWER(email) = LOWER($1)",
        [profileEmail],
      );
      user = emailRows[0];

      if (user) {
        const { rows: updatedRows } = await pool.query<UserRow>(
          `UPDATE users
           SET github_id = $1,
               name = COALESCE($2, name),
               avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN $3 ELSE avatar_url END,
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [githubId, profileName, avatarUrl, user.id],
        );
        user = updatedRows[0] || user;
      }
    }

    // 6. If user doesn't exist, create a new record
    if (!user) {
      const baseUsername = sanitizeUsername(
        username || profileName || "GitHubUser",
      );

      const { rows: existingUsers } = await pool.query<UserRow>(
        "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
        [baseUsername],
      );

      let finalUsername = baseUsername;
      if (existingUsers.length > 0) {
        finalUsername = `${baseUsername.slice(0, 16)}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const { rows: newRows } = await pool.query<UserRow>(
        `INSERT INTO users (username, name, email, github_id, avatar_url, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, name, email, google_id, github_id, avatar_url, email_verified, created_at`,
        [finalUsername, profileName, profileEmail, githubId, avatarUrl, true],
      );
      user = newRows[0];
    }

    if (!user) {
      res.status(500).json({
        error:
          "Failed to create or retrieve user profile for GitHub authentication.",
      });
      return;
    }

    const token = signToken(user.id, user.username);
    res.status(200).json({ token, user: publicUser(user) });
  } catch (err: unknown) {
    console.error("GitHub auth error:", err);
    res.status(500).json({
      error:
        err instanceof Error ? err.message : "GitHub authentication failed.",
    });
  }
}

router.post("/github", handleGitHubAuth);
router.post("/", handleGitHubAuth);
router.get("/github/callback", handleGitHubCallback);
router.get("/callback", handleGitHubCallback);

export default router;
