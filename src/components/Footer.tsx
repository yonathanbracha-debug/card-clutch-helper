import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border">
      <div className="container max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-medium text-foreground hover:text-foreground/80 transition-colors">
              CardClutch
            </Link>
            <span className="hidden md:inline">
              Decision intelligence for credit card usage
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/trust" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>© 2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
}