import React, { useState } from "react";
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { GoogleButton } from "./GoogleButton";
import { validateUsername, validatePassword } from "../../lib/authApi";

interface AuthPageProps {
  initialMode?: "login" | "register";
  isModal?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

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
  const [clientErrors, setClientErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);

  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
    clearError();
    setClientErrors({});
  }

  const handleModeSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    clearError();
    setClientErrors({});
    setSuccessMessage(null);
    if (newMode === "login") {
      window.location.hash = "#login";
    } else {
      window.location.hash = "#register";
    }
  };

  const handleDismissError = () => {
    clearError();
    setClientErrors({});
  };

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string; confirmPassword?: string } = {};

    const userErr = validateUsername(username);
    if (userErr) errors.username = userErr;

    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;

    if (mode === "register") {
      if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
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
        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 600);
      }
    } else {
      const ok = await register(username, password);
      if (ok) {
        setSuccessMessage(`Welcome to ScaleGuess, ${username}! Account created.`);
        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 700);
      }
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    setSuccessMessage(null);
    const ok = await loginWithGoogle({
      name: "Google Explorer",
      email: "explorer@scale.app",
    });
    if (ok) {
      setSuccessMessage("Signed in successfully with Google!");
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 600);
    }
  };

  const handleFillDemo = () => {
    clearError();
    setClientErrors({});
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const demoUser = `scale_pilot_${randomSuffix}`;
    setUsername(demoUser);
    setPassword("password123");
    if (mode === "register") {
      setConfirmPassword("password123");
    }
  };

  const handleExit = () => {
    if (onClose) {
      onClose();
    } else {
      closeAuth();
    }
  };

  // Username validation state
  const isUsernameValid = username.length > 0 && !validateUsername(username);
  const isPasswordValid = password.length >= 4;
  const isConfirmValid = mode === "register" && confirmPassword.length > 0 && confirmPassword === password;

  return (
    <div
      className={`w-full flex items-center justify-center ${
        isModal ? "p-0" : "min-h-[calc(100vh-80px)] p-4 sm:p-6"
      }`}
    >
      <div
        className={`w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-200 ${
          isModal ? "border-primary/20 ring-1 ring-primary/20" : ""
        }`}
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar: Back button */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <button
            type="button"
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Game</span>
          </button>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary/80 border border-border text-muted-foreground">
            {mode === "login" ? "Auth · Sign In" : "Auth · Register"}
          </span>
        </div>

        {/* Header / Brand */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "login"
              ? "Sign in to track your scale estimates, streaks, and scores."
              : "Register to join the global size estimation leaderboard."}
          </p>
        </div>

        {/* Tab switcher: Login vs Register */}
        <div className="grid grid-cols-2 p-1 bg-secondary/60 border border-border/60 rounded-xl mb-6 relative z-10">
          <button
            type="button"
            onClick={() => handleModeSwitch("login")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              mode === "login"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("register")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              mode === "register"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Register
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive-foreground text-xs flex items-start justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <span className="font-medium">{serverError}</span>
            </div>
            <button
              type="button"
              onClick={handleDismissError}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Google Sign In Section */}
        <div className="space-y-4 mb-5 relative z-10">
          <GoogleButton
            onClick={handleGoogleLogin}
            isLoading={isSubmitting}
            label={mode === "login" ? "Login from Google" : "Sign up with Google"}
          />

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-border/70" />
            <span className="absolute bg-card px-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80">
              or continue with username
            </span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10" noValidate>
          {/* Username Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="auth-username" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Username</span>
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {username.length}/32
              </span>
            </div>
            <div className="relative">
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (clientErrors.username) {
                    setClientErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
                maxLength={32}
                placeholder="e.g. quantum_scale"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-secondary/50 border text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  clientErrors.username
                    ? "border-destructive focus:border-destructive"
                    : isUsernameValid
                    ? "border-emerald-500/40 focus:border-primary"
                    : "border-border/80 focus:border-primary"
                }`}
                disabled={isSubmitting}
              />
              {isUsernameValid && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-3 pointer-events-none" />
              )}
            </div>
            {clientErrors.username ? (
              <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {clientErrors.username}
              </p>
            ) : (
              <p className="text-[10px] font-mono text-muted-foreground/80 mt-1">
                1–32 characters, alphanumeric, underscores & hyphens
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="auth-password" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Password</span>
              </label>
              {mode === "login" && (
                <span className="text-[10px] font-mono text-muted-foreground">Min 4 chars</span>
              )}
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (clientErrors.password) {
                    setClientErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="••••••••"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-secondary/50 border text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 ${
                  clientErrors.password
                    ? "border-destructive focus:border-destructive"
                    : isPasswordValid
                    ? "border-border/80 focus:border-primary"
                    : "border-border/80 focus:border-primary"
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {clientErrors.password ? (
              <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {clientErrors.password}
              </p>
            ) : mode === "register" ? (
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[10px] font-mono text-muted-foreground/80">
                  Minimum 4 characters required
                </p>
                {password.length > 0 && (
                  <span
                    className={`text-[10px] font-mono ${
                      password.length >= 4 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {password.length >= 4 ? "Valid length" : `${4 - password.length} more needed`}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Confirm Password Field (Only on Register) */}
          {mode === "register" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-confirm-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Confirm Password</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (clientErrors.confirmPassword) {
                      setClientErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-secondary/50 border text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 ${
                    clientErrors.confirmPassword
                      ? "border-destructive focus:border-destructive"
                      : isConfirmValid
                      ? "border-emerald-500/40 focus:border-primary"
                      : "border-border/80 focus:border-primary"
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {clientErrors.confirmPassword && (
                <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {clientErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
              </>
            ) : (
              <span>{mode === "login" ? "Sign In to ScaleGuess" : "Create Account"}</span>
            )}
          </button>
        </form>

        {/* Demo fill button & Guest option */}
        <div className="mt-6 pt-4 border-t border-border/60 flex flex-col gap-2.5 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono text-primary/80 hover:text-primary transition-colors hover:underline"
            >
              ⚡ Fill demo credentials
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Play as Guest →
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-2">
            {mode === "login" ? (
              <>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className="text-primary hover:underline font-medium"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in here
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
