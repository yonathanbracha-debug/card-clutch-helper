import { CreditCard, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <CreditCard className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              Card<span className="gradient-text">Clutch</span>
            </span>
          </a>

          {/* Made with love */}
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> for smarter spending
          </p>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#privacy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <span className="text-border">•</span>
            <span>© 2024 CardClutch</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
