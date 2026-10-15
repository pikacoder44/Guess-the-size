import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { GoogleAuthPayload, User } from "../types/auth";
import {
  loginUser,
  registerUser,
  googleLogin,
  getMe,
  updateUserProfile,
  AuthApiError,
} from "../lib/authApi";

const TOKEN_KEY = "scaleguess_auth_token";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  authView: "none" | "login" | "register";
  isProfileOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  closeAuth: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  setAuthView: (view: "none" | "login" | "register") => void;
  clearError: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: (payload?: GoogleAuthPayload) => Promise<boolean>;
  updateProfile: (payload: {
    name?: string | null;
    avatarUrl?: string | null;
    profilePicture?: string | null;
  }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"none" | "login" | "register">("none");
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // On mount: restore session if token exists
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getMe(storedToken);
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn("Session restore failed or expired:", err);
        localStorage.removeItem(TOKEN_KEY);
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for hash-based navigation (#login or #register)
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#login") {
        setAuthView("login");
      } else if (hash === "#register") {
        setAuthView("register");
      }
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openLogin = useCallback(() => {
    setError(null);
    setAuthView("login");
    window.location.hash = "#login";
  }, []);

  const openRegister = useCallback(() => {
    setError(null);
    setAuthView("register");
    window.location.hash = "#register";
  }, []);

  const closeAuth = useCallback(() => {
    setError(null);
    setAuthView("none");
    if (window.location.hash === "#login" || window.location.hash === "#register") {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const persistSession = (newToken: string, newUser: User) => {
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
    } catch {
      // ignore storage quota error
    }
    setToken(newToken);
    setUser(newUser);
    setError(null);
    closeAuth();
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await loginUser({ username, password });
      persistSession(res.token, res.user);
      return true;
    } catch (err: unknown) {
      const message = err instanceof AuthApiError ? err.message : "Failed to log in. Please try again.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await registerUser({ username, password });
      persistSession(res.token, res.user);
      return true;
    } catch (err: unknown) {
      const message = err instanceof AuthApiError ? err.message : "Failed to register. Please try again.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginWithGoogle = async (payload?: GoogleAuthPayload): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!payload?.credential && !payload?.access_token) {
        throw new AuthApiError("No Google authentication credentials provided.");
      }
      const res = await googleLogin(payload);
      persistSession(res.token, res.user);
      return true;
    } catch (err: unknown) {
      const message = err instanceof AuthApiError ? err.message : "Google authentication failed. Please try again.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openProfile = useCallback(() => {
    setIsProfileOpen(true);
  }, []);

  const closeProfile = useCallback(() => {
    setIsProfileOpen(false);
  }, []);

  const updateProfile = async (payload: {
    name?: string | null;
    avatarUrl?: string | null;
    profilePicture?: string | null;
  }): Promise<boolean> => {
    if (!token) return false;
    setIsSubmitting(true);
    setError(null);
    try {
      const updatedUser = await updateUserProfile(token, payload);
      setUser(updatedUser);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof AuthApiError ? err.message : "Failed to update profile settings.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    setError(null);
    setIsProfileOpen(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isSubmitting,
        error,
        authView,
        isProfileOpen,
        openLogin,
        openRegister,
        closeAuth,
        openProfile,
        closeProfile,
        setAuthView,
        clearError,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
