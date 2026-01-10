import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-12 px-4 border-t border-border/40 relative z-10">
      <div className="container max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="font-semibold text-foreground hover:text-primary transition-colors">
              CardClutch
            </Link>
            <p className="mt-2 text-sm text-muted-foreground font-mono-accent">
              Credit decisions, simplified.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="font-mono-accent text-xs uppercase tracking-wider text-muted-foreground/70 mb-3">
              Product
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Analyzer
              </Link>
              <Link to="/ask" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Ask Credit AI
              </Link>
              <Link to="/cards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Card Catalog
              </Link>
            </div>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-mono-accent text-xs uppercase tracking-wider text-muted-foreground/70 mb-3">
              Company
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/mission" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Mission
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-6 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono-accent text-xs text-muted-foreground/50">
            © {currentYear} CardClutch. Informational only. Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
