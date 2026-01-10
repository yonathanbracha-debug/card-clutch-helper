import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-16 px-6 border-t border-border relative bg-background theme-transition">
      <div className="container-main">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <img 
                src="/favicon.png" 
                alt="CardClutch" 
                className="w-6 h-6 rounded-lg"
              />
              <span className="text-base font-semibold text-foreground">CardClutch</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Credit decisions, simplified. 
              No bank connections required.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
              Product
            </h4>
            <div className="flex flex-col gap-3">
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
              Company
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/mission" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Mission
              </Link>
              <Link to="/mission#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Roadmap
              </Link>
              <Link to="/trust" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Trust
              </Link>
            </div>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
              Legal
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Security
              </Link>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © {currentYear} CardClutch. All rights reserved.
          </span>
          <span className="text-sm text-muted-foreground">
            Informational only. Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
