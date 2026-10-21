import type { AppRoute } from "@/App";

interface FooterProps {
  onNavigate?: (route: AppRoute) => void;
}

export function Footer({ onNavigate: _onNavigate }: FooterProps = {}) {
  return (
    <footer className="w-full border-t border-neutral-800/60 py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-xs font-mono text-neutral-500">
          Synapse © 2026. Built for quick cognitive breaks.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
