import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { GoogleButton } from "./GoogleButton";
import { GitHubButton } from "./GitHubButton";
import { validateUsername, validatePassword } from "../../lib/authApi";

/* ─────────────────────── Types ─────────────────────── */

interface AuthPageProps {
  initialMode?: "login" | "register";
  isModal?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

/* ─────────────────────── Helpers ─────────────────────── */

function fieldClass(hasError: boolean, isValid: boolean, extra = ""): string {
  const base =
    "w-full px-4 py-2.5 rounded-lg bg-secondary/40 border text-sm text-foreground " +
    "placeholder:text-muted-foreground/40 transition-colors duration-150 " +
    "focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans ";
  if (hasError) return base + "border-destructive/60 " + extra;
  if (isValid)  return base + "border-emerald-500/40 " + extra;
  return base + "border-border/70 focus:border-primary/50 " + extra;
}

/* ─────────────────────── Component ─────────────────────── */

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "login",
  isModal = false,
  onSuccess,
  onClose,
}) => {
  const {
    login,
    register,
    loginWithGoogle,
    isSubmitting,
    error: serverError,
    clearError,
    closeAuth,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [clientErrors, setClientErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* Sync when parent changes initialMode */
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
    clearError();
    setClientErrors({});
  }

  const isUsernameValid = username.length > 0 && !validateUsername(username);
  const isConfirmValid =
    mode === "register" && confirmPassword.length > 0 && confirmPassword === password;

  const anyLoading = isSubmitting || socialLoading !== null;

  /* ── Handlers ── */
  const handleModeSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    clearError();
    setClientErrors({});
    setSuccessMessage(null);
    window.location.hash = `#${newMode}`;
  };

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string; confirmPassword?: string } = {};
    const userErr = validateUsername(username);
    if (userErr) errors.username = userErr;
    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;
    if (mode === "register") {
      if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
      else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    }
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);
    if (!validateForm()) return;
    if (mode === "login") {
      const ok = await login(username, password);
      if (ok) {
        setSuccessMessage(`Welcome back, ${username}!`);
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 600);
      }
    } else {
      const ok = await register(username, password);
      if (ok) {
        setSuccessMessage(`Account created. Welcome, ${username}!`);
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 700);
      }
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    setSuccessMessage(null);
    setSocialLoading("google");
    try {
      const ok = await loginWithGoogle({ name: "Google Explorer", email: "explorer@scale.app" });
      if (ok) {
        setSuccessMessage("Signed in with Google!");
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 600);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGitHubLogin = async () => {
    clearError();
    setSuccessMessage(null);
    setSocialLoading("github");
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 1400));
      const ok = await loginWithGoogle({ name: "GitHub Explorer", email: "explorer+github@scale.app" });
      if (ok) {
        setSuccessMessage("Signed in with GitHub!");
        setTimeout(() => { onSuccess?.(); onClose?.(); }, 600);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleExit = () => {
    if (onClose) onClose(); else closeAuth();
  };

  /* ─────────────── Render ─────────────── */
  return (
    <div
      className={`w-full flex items-center justify-center ${
        isModal ? "p-0" : "min-h-[calc(100vh-80px)] p-4 sm:p-6"
      }`}
    >
      <div
        className={`
          w-full max-w-md relative overflow-hidden font-sans
          bg-card/95 backdrop-blur-xl border rounded-2xl shadow-2xl
          transition-all duration-200
          ${isModal
            ? "border-border/60 ring-1 ring-white/5 p-7 sm:p-8"
            : "border-border/80 p-6 sm:p-8"
          }
        `}
      >
        {/* Ambient glows */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/4 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        {/* Back to game — only when rendered as a page, not a modal */}
        {!isModal && (
          <div className="flex items-center mb-7 relative z-10">
            <button
              type="button"
              onClick={handleExit}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              aria-label="Back to game"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Game
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-7 relative z-10">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {mode === "login" ? "Sign in" : "Create an account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Welcome back to ScaleGuess." : "Start tracking your size estimates."}
          </p>
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="grid grid-cols-2 p-1 bg-secondary/50 border border-border/50 rounded-xl mb-6 relative z-10"
        >
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => handleModeSwitch(tab)}
              className={`
                py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${mode === tab
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {tab === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Success banner */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Error banner */}
        {serverError && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 rounded-xl bg-destructive/12 border border-destructive/25 text-destructive-foreground text-sm flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              {serverError}
            </div>
            <button
              type="button"
              onClick={() => { clearError(); setClientErrors({}); }}
              aria-label="Dismiss error"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Social buttons */}
        <div className="space-y-3 mb-6 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <GoogleButton
              onClick={handleGoogleLogin}
              isLoading={socialLoading === "google"}
              disabled={anyLoading && socialLoading !== "google"}
              label="Google"
            />
            <GitHubButton
              onClick={handleGitHubLogin}
              isLoading={socialLoading === "github"}
              disabled={anyLoading && socialLoading !== "github"}
              label="GitHub"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-border/50" />
            <span className="px-3 text-xs text-muted-foreground/60">or</span>
            <div className="flex-1 border-t border-border/50" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10" noValidate>

          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="auth-username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <div className="relative">
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (clientErrors.username)
                    setClientErrors((p) => ({ ...p, username: undefined }));
                }}
                maxLength={32}
                placeholder="your_username"
                className={fieldClass(!!clientErrors.username, isUsernameValid, isUsernameValid ? "pr-9" : "")}
                disabled={anyLoading}
                aria-invalid={!!clientErrors.username}
                aria-describedby={clientErrors.username ? "username-error" : undefined}
              />
              {isUsernameValid && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
            {clientErrors.username && (
              <p id="username-error" className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {clientErrors.username}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (clientErrors.password)
                    setClientErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="••••••••"
                className={fieldClass(!!clientErrors.password, false, "pr-10")}
                disabled={anyLoading}
                aria-invalid={!!clientErrors.password}
                aria-describedby={clientErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {clientErrors.password && (
              <p id="password-error" className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {clientErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          {mode === "register" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <label htmlFor="auth-confirm-password" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (clientErrors.confirmPassword)
                      setClientErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }}
                  placeholder="••••••••"
                  className={fieldClass(!!clientErrors.confirmPassword, isConfirmValid, isConfirmValid ? "pr-16" : "pr-10")}
                  disabled={anyLoading}
                  aria-invalid={!!clientErrors.confirmPassword}
                  aria-describedby={clientErrors.confirmPassword ? "confirm-error" : undefined}
                />
                {isConfirmValid && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {clientErrors.confirmPassword && (
                <p id="confirm-error" className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {clientErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={anyLoading}
            className="
              w-full mt-1 py-2.5 px-4 rounded-xl font-semibold text-sm
              bg-primary text-primary-foreground
              hover:brightness-105 active:scale-[0.99]
              transition-all duration-150
              flex items-center justify-center gap-2
              shadow-md shadow-primary/20
              disabled:opacity-50 disabled:pointer-events-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
            "
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : (
              mode === "login" ? "Sign in" : "Create account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-3 relative z-10">
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className="text-primary hover:underline font-medium"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {!isModal && (
            <p className="text-center text-xs text-muted-foreground/60">
              <button
                type="button"
                onClick={handleExit}
                className="hover:text-muted-foreground transition-colors"
              >
                Continue as guest →
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
