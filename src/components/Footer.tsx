import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-16 px-6 border-t border-border relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-sm font-medium text-foreground">
              CardClutch
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Credit decisions, simplified.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Product
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Analyzer
              </Link>
              <Link to="/ask" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Ask
              </Link>
              <Link to="/cards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cards
              </Link>
            </div>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Company
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/mission" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Mission
              </Link>
              <Link to="/mission#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Roadmap
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
            </div>
          </div>
          
          {/* Connect */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Account
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            © {currentYear} CardClutch
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Informational only. Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
