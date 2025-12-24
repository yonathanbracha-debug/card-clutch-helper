import { CreditCard, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

const navLinks = [
  { href: '/mission', label: 'Mission' },
  { href: '/product', label: 'Product' },
  { href: '/founders', label: 'Founders' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/trust', label: 'Trust' },
];

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 transition-colors duration-300">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              Card<span className="gradient-text">Clutch</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm transition-colors",
                  location.pathname === link.href
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={onThemeToggle} />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/10 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
