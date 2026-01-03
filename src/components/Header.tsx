import { Menu, X, LogIn, LogOut, User, Shield, LayoutDashboard, Home, Sparkles, Library, Lock, Target } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/features', label: 'Features', icon: Sparkles },
  { href: '/cards', label: 'Cards', icon: Library },
  { href: '/privacy', label: 'Privacy', icon: Lock },
  { href: '/mission', label: 'Mission', icon: Target },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useThemeContext();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img 
              src="/favicon.png" 
              alt="CardClutch" 
              className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-semibold tracking-tight hidden sm:inline">
              CardClutch
            </span>
          </Link>

          {/* Desktop Navigation - Horizontal centered next to logo */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href || 
                (link.href !== '/' && location.pathname.startsWith(link.href));
              
              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className="relative px-3 py-2 flex items-center gap-1.5"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tubelight-bg"
                      className="absolute inset-0 bg-primary/10 rounded-lg"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={cn(
                    "w-4 h-4 relative z-10 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium transition-colors relative z-10",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}>
                    {link.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="tubelight-glow"
                      className="absolute inset-x-2 -bottom-px h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-24 truncate">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard" className="flex items-center">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/analyze" className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyzer
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/admin" className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Console
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Button>
              </Link>
            )}
            
            {/* Mobile menu button - only show below md */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - only show below md */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href || 
                  (link.href !== '/' && location.pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="border-t border-border mt-2 pt-2">
                <Link
                  to="/analyze"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-primary font-medium hover:bg-primary/10"
                >
                  <Sparkles className="w-4 h-4" />
                  Try Analyzer
                </Link>
                {user && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Console
                  </Link>
                )}
                {user ? (
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
