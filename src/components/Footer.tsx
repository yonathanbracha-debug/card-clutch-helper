import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border/50 relative z-10">
      <div className="container max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-medium text-foreground hover:text-primary transition-colors">
              CardClutch
            </Link>
            <span className="hidden md:inline font-mono text-xs">
              Credit decisions, simplified.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/analyze" className="hover:text-foreground transition-colors">
              Analyzer
            </Link>
            <Link to="/ask" className="hover:text-foreground transition-colors">
              Ask
            </Link>
            <Link to="/cards" className="hover:text-foreground transition-colors">
              Cards
            </Link>
            <Link to="/mission" className="hover:text-foreground transition-colors">
              Mission
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground/60">© 2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
