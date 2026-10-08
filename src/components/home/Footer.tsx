import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 mt-16 sm:mt-24 py-8 text-xs text-muted-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold text-foreground">Synapse</span>
          <span className="opacity-40">·</span>
          <span className="font-mono text-[11px]">Casual Brain &amp; Perception Games</span>
        </div>

        <div className="font-mono text-[11px] text-muted-foreground">
          Free &amp; Open Access
        </div>
      </div>
    </footer>
  );
}

export default Footer;
