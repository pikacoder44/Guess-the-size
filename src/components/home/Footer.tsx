import { Brain, ExternalLink, Code2 } from "lucide-react";

interface FooterProps {
  onNavigate?: (route: "home" | "scaleGuess") => void;
}

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const CURRENT_YEAR = new Date().getFullYear();

export function Footer({ onNavigate }: FooterProps) {
  const handleGameClick = (route: "home" | "scaleGuess") => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      const target = route === "home" ? "/" : "/scaleGuess";
      history.pushState(null, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <footer className="w-full border-t border-border/40 mt-16 sm:mt-24 pt-12 pb-8 text-xs text-muted-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Multi-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 pb-10 border-b border-border/30">
          {/* Brand & Blurb (Span 2) */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleGameClick("home")}
              className="flex items-center gap-2 text-foreground font-display font-bold text-lg hover:text-primary transition-colors cursor-pointer w-fit"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
                <Brain className="w-4 h-4" />
              </div>
              <span>Synapse</span>
            </button>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mt-1">
              A minimalist, free casual brain game platform testing spatial estimation,
              working memory, and visual reflexes in bite-sized sessions.
            </p>

            {/* Creator link */}
            <div className="mt-2 pt-1 flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground/80">
                Built by
              </span>
              <a
                href="https://github.com/pikacoder44"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/60 hover:bg-secondary text-foreground text-[11px] font-mono border border-border/60 hover:border-primary/40 transition-all cursor-pointer group"
              >
                <GithubIcon className="w-3.5 h-3.5 text-primary group-hover:scale-105 transition-transform" />
                <span>pikacoder44</span>
                <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Column 2: Games */}
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-foreground font-semibold">
              Games
            </span>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleGameClick("scaleGuess")}
                  className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span>ScaleGuess</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </button>
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground/60">
                <span>SequenceMind</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary/80 border border-border/40">
                  Soon
                </span>
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground/60">
                <span>FlashCount</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary/80 border border-border/40">
                  Soon
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Open Source & Code */}
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-foreground font-semibold">
              Open Source
            </span>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <a
                  href="https://github.com/pikacoder44/Guess-the-size"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5 opacity-70" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/pikacoder44/Guess-the-size/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Issues &amp; Feedback</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li className="text-muted-foreground/60 font-mono text-[11px]">
                MIT License · v1.0.0
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground/75">
          <div>
            © {CURRENT_YEAR} Synapse. Free and open source.
          </div>

          <div className="flex items-center gap-1">
            <span>Crafted with passion by</span>
            <a
              href="https://github.com/pikacoder44"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors underline underline-offset-2"
            >
              pikacoder44
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
