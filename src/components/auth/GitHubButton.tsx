import React from "react";
import { Loader2 } from "lucide-react";

interface GitHubButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const GitHubButton: React.FC<GitHubButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  label = "Continue with GitHub",
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label="Continue with GitHub"
      className={`
        w-full group relative flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg
        border border-border/70 bg-secondary/50 hover:bg-secondary/80 text-foreground text-sm font-sans
        transition-all duration-200 ease-out hover:border-border
        active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none
        focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none
        ${className}
      `}
    >
      {/* Subtle hover overlay */}
      <span className="absolute inset-0 rounded-lg bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        /* GitHub Mark SVG */
        <svg
          className="w-5 h-5 flex-shrink-0 fill-foreground transition-transform duration-200 group-hover:scale-105"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      )}

      <span className="relative z-10">
        {isLoading ? "Connecting…" : label}
      </span>
    </button>
  );
};
