import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AuthPage } from "./AuthPage";

/**
 * AuthModal
 *
 * A fully-featured modal wrapper for the auth flow.
 *
 * Dismiss triggers:
 *  - The explicit X button (top-right corner)
 *  - Pressing the Escape key
 *  - Clicking the semi-transparent backdrop
 *
 * Renders AuthPage as its content, passing `isModal={true}` so the
 * inner component can adjust its layout accordingly.
 */
export const AuthModal: React.FC = () => {
  const { authView, closeAuth } = useAuth();
  const isOpen = authView !== "none";
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Escape key handler ── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closeAuth]);

  /* ── Scroll lock while modal is open ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the click is directly on the backdrop (not the panel)
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      closeAuth();
    }
  };

  return (
    /* ── Backdrop ── */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={authView === "login" ? "Sign In" : "Create Account"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Glass backdrop */}
      <div
        className="absolute inset-0 bg-background/75 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Ambient glow behind the panel */}
      <div
        className="absolute w-[480px] h-[480px] rounded-full bg-primary/8 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Modal Panel ── */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-250"
      >
        {/* X Close button – top-right of panel */}
        <button
          type="button"
          onClick={closeAuth}
          aria-label="Close dialog"
          className="
            absolute -top-3 -right-3 z-20
            w-8 h-8 rounded-full
            flex items-center justify-center
            bg-card border border-border/80
            text-muted-foreground hover:text-foreground
            shadow-lg hover:shadow-xl
            hover:bg-secondary hover:border-border
            hover:scale-110 active:scale-95
            transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <AuthPage
          initialMode={authView === "none" ? "login" : authView}
          isModal={true}
          onClose={closeAuth}
          onSuccess={closeAuth}
        />
      </div>
    </div>
  );
};
