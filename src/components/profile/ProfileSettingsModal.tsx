import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Sparkles,
  Link2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function uploadAvatar(file: File, userId: string | number): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar to Supabase storage:', error);
    return null;
  }
}

async function deleteAvatarFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !publicUrl) return false;

    // Extract file path from Supabase storage public URL
    // URL structure: .../storage/v1/object/public/avatars/FILENAME.jpg
    const urlParts = publicUrl.split('/avatars/');
    if (urlParts.length < 2) return false; // Not a Supabase bucket URL (e.g., Google or DiceBear URL)

    const filePath = decodeURIComponent(urlParts[1]);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error removing file from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete avatar file:', error);
    return false;
  }
}

// Fun preset avatars using DiceBear / stylized SVG personas
const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cosmo&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Synapse&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Pixel&backgroundColor=ffdfbf",
];

export const ProfileSettingsModal: React.FC = () => {
  const { user, isProfileOpen } = useAuth();
  if (!isProfileOpen || !user) return null;
  return <ProfileSettingsModalContent />;
};

const ProfileSettingsModalContent: React.FC = () => {
  const { user, closeProfile, updateProfile, isSubmitting } = useAuth();

  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl || user?.profilePicture || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sync state whenever the authenticated user updates
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      const currentAvatar = user.avatarUrl || user.profilePicture || null;
      setAvatarUrl(currentAvatar);
      setPreviewUrl(currentAvatar);
      setSelectedFile(null);
      setAvatarLoadError(false);
    }
  }, [user]);

  // Reset load error when preview URL is modified
  React.useEffect(() => {
    setAvatarLoadError(false);
  }, [previewUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Handle local file selection for uploading to Supabase Storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please select a valid image file (PNG, JPG, WEBP)." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Image file is too large. Please select an image under 5MB." });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStatusMessage({ type: "success", text: "Photo selected. Click 'Save Changes' to upload and update." });
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setStatusMessage({ type: "error", text: "Please enter a valid URL starting with http:// or https://" });
      return;
    }
    setSelectedFile(null);
    setAvatarUrl(trimmed);
    setPreviewUrl(trimmed);
    setUrlInput("");
    setShowUrlInput(false);
    setStatusMessage({ type: "success", text: "Profile image URL applied. Click 'Save Changes' to update." });
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarUrl(null);
    setPreviewUrl(null);
    setStatusMessage({ type: "success", text: "Profile picture cleared. Click 'Save Changes' to confirm." });
  };

  const handleSelectPreset = (presetUrl: string) => {
    setSelectedFile(null);
    setAvatarUrl(presetUrl);
    setPreviewUrl(presetUrl);
    setStatusMessage({ type: "success", text: "Preset avatar selected. Click 'Save Changes' to update." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setStatusMessage(null);
  setIsUploading(true);

  let finalAvatarUrl = avatarUrl;

  // 1. If user uploaded a new local file, send to bucket
  if (selectedFile) {
    const uploadedPublicUrl = await uploadAvatar(selectedFile, user.id);
    if (uploadedPublicUrl) {
      finalAvatarUrl = uploadedPublicUrl;
    } else {
      setIsUploading(false);
      setStatusMessage({ type: "error", text: "Failed to upload image to storage bucket." });
      return;
    }
  }

  // 2. If user removed their avatar (or picked a non-bucket image), 
  // delete the old stored file from Supabase if it belonged to our bucket
  const previousAvatar = user.avatarUrl || user.profilePicture;
  if (previousAvatar && previousAvatar !== finalAvatarUrl) {
    if (previousAvatar.includes('/storage/v1/object/public/avatars/')) {
      await deleteAvatarFromStorage(previousAvatar);
    }
  }

  // 3. Persist the updated avatar URL to your backend API
  const ok = await updateProfile({
    name: displayName.trim() || null,
    avatarUrl: finalAvatarUrl || null,
    profilePicture: finalAvatarUrl || null,
  });

  setIsUploading(false);

  if (ok) {
    setStatusMessage({ type: "success", text: "Profile updated successfully!" });
    setTimeout(() => {
      closeProfile();
    }, 700);
  } else {
    setStatusMessage({ type: "error", text: "Failed to update profile. Please try again." });
  }
};

  const isGoogleAccount = Boolean(user.googleId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={closeProfile} aria-hidden="true" />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-card/95 border border-border/80 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 font-sans">
        {/* Glow */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-settings-title" className="text-lg font-bold text-foreground">
                Profile Settings
              </h2>
              <p className="text-xs text-muted-foreground">Manage your display name and avatar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeProfile}
            aria-label="Close profile settings"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mt-4 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                : "bg-destructive/10 border border-destructive/25 text-destructive-foreground"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Profile Picture Section */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Profile Picture (Optional)
            </span>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-primary/30 overflow-hidden bg-secondary flex items-center justify-center shadow-inner">
                  {previewUrl && !avatarLoadError ? (
                    <img
                      src={previewUrl}
                      alt={user.username}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarLoadError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/15 text-primary text-2xl font-bold font-mono">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload & Management Actions */}
              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Image URL</span>
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      title="Remove profile picture"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Preset Avatars Row */}
                <div className="pt-2">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-3 h-3 text-primary" /> Or pick a fun preset avatar:
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {PRESET_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectPreset(url)}
                        className={`w-7 h-7 rounded-full border overflow-hidden hover:scale-110 active:scale-95 transition-transform cursor-pointer ${
                          previewUrl === url ? "ring-2 ring-primary border-primary" : "border-border"
                        }`}
                        title={`Select Avatar ${i + 1}`}
                      >
                        <img
                          src={url}
                          alt={`Preset ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Image URL input box */}
                {showUrlInput && (
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="profile-display-name" className="text-xs font-semibold text-foreground">
              Display Name (Optional)
            </label>
            <input
              id="profile-display-name"
              type="text"
              maxLength={60}
              placeholder="Your full or display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">
              Shown to other players on leaderboards. Your unique handle remains{" "}
              <span className="font-mono text-foreground font-medium">@{user.username}</span>.
            </p>
          </div>

          {/* 3. Account Details Summary */}
          <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-mono font-medium text-foreground">@{user.username}</span>
            </div>

            {user.email && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground flex items-center gap-1.5">
                  {user.email}
                  {user.emailVerified && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-medium">
                      Verified
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sign-in Method:</span>
              {isGoogleAccount ? (
                <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google Account
                </span>
              ) : (
                <span className="text-muted-foreground font-medium">Standard Account</span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={closeProfile}
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;