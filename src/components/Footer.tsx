import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-16 px-4 border-t border-border relative z-10">
      <div className="container max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
              CardClutch
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Credit decisions, simplified.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="font-mono-accent text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">
              Product
            </h4>
            <div className="flex flex-col gap-3">
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
            <h4 className="font-mono-accent text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">
              Company
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/mission" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Mission
              </Link>
              <Link to="/mission#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Roadmap
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
          
          {/* Connect */}
          <div>
            <h4 className="font-mono-accent text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <span className="font-mono-accent text-xs text-muted-foreground/40">
            © {currentYear} CardClutch
          </span>
          <span className="font-mono-accent text-xs text-muted-foreground/40">
            Informational only. Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
