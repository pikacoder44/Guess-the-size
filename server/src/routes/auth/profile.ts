import { Router, Request, Response } from "express";
import pool from "../../db.js";
import { UserRow, publicUser } from "./utils.js";

const router = Router();

// ---------------------------------------------------------------------------
// PATCH & PUT /profile (or /)
// ---------------------------------------------------------------------------
/**
 * Update authenticated user's profile settings (name and profile picture / avatar_url).
 * Body: { name?: string | null, avatarUrl?: string | null, profilePicture?: string | null }
 */
export async function handleUpdateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const { name, avatarUrl, profilePicture } = req.body ?? {};
  const requestedAvatar = avatarUrl !== undefined ? avatarUrl : profilePicture;

  console.log(`[handleUpdateProfile] User ID: ${req.user.userId}`);
  console.log(`[handleUpdateProfile] Incoming payload:`, {
    name,
    hasAvatarUrl: avatarUrl !== undefined,
    hasProfilePicture: profilePicture !== undefined,
    avatarPreview:
      typeof requestedAvatar === "string"
        ? `${requestedAvatar.slice(0, 50)}... (${requestedAvatar.length} chars)`
        : requestedAvatar,
  });

  // Validate name if provided
  let cleanName: string | null = null;
  if (name !== undefined) {
    if (typeof name === "string" && name.trim().length > 0) {
      if (name.trim().length > 60) {
        res
          .status(400)
          .json({ error: "Display name must be 60 characters or fewer." });
        return;
      }
      cleanName = name.trim();
    } else {
      cleanName = null;
    }
  }

  // Validate avatar if provided
  let cleanAvatar: string | null = null;
  if (requestedAvatar !== undefined) {
    if (
      typeof requestedAvatar === "string" &&
      requestedAvatar.trim().length > 0
    ) {
      const trimmed = requestedAvatar.trim();
      // Allow base64 data URIs or http/https URLs
      if (
        !trimmed.startsWith("data:image/") &&
        !/^https?:\/\//i.test(trimmed)
      ) {
        res.status(400).json({
          error: "Profile picture must be a valid image URL or image file.",
        });
        return;
      }
      cleanAvatar = trimmed;
    } else {
      cleanAvatar = null;
    }
  }

  try {
    const { rows: currentRows } = await pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [req.user.userId],
    );
    const currentUser = currentRows[0];
    if (!currentUser) {
      console.warn(
        `[handleUpdateProfile] User not found with ID ${req.user.userId}`,
      );
      res.status(404).json({ error: "User not found." });
      return;
    }

    const finalName = name !== undefined ? cleanName : currentUser.name;
    const finalAvatar =
      requestedAvatar !== undefined ? cleanAvatar : currentUser.avatar_url;

    console.log(
      `[handleUpdateProfile] Executing SQL UPDATE for user ${req.user.userId}. finalAvatar:`,
      typeof finalAvatar === "string"
        ? `${finalAvatar.slice(0, 50)}... (${finalAvatar.length} chars)`
        : finalAvatar,
    );

    const { rows: updatedRows } = await pool.query<UserRow>(
      `UPDATE users
       SET name = $1,
           avatar_url = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [finalName, finalAvatar, req.user.userId],
    );

    if (!updatedRows || updatedRows.length === 0) {
      console.error(
        `[handleUpdateProfile] UPDATE returned 0 rows for user ID ${req.user.userId}`,
      );
      res
        .status(500)
        .json({ error: "Failed to update profile settings in database." });
      return;
    }

    const updatedUser = updatedRows[0];
    console.log(
      `[handleUpdateProfile] Successfully updated user ID ${updatedUser.id}. Persisted avatar_url:`,
      updatedUser.avatar_url
        ? `${updatedUser.avatar_url.slice(0, 50)}...`
        : null,
    );
    res.status(200).json({ user: publicUser(updatedUser) });
  } catch (err: unknown) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile settings." });
  }
}

router.patch("/profile", handleUpdateProfile);
router.put("/profile", handleUpdateProfile);
router.patch("/", handleUpdateProfile);
router.put("/", handleUpdateProfile);

export default router;
