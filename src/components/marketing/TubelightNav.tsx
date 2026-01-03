import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface TubelightNavProps {
  items: NavItem[];
  className?: string;
}

export function TubelightNav({ items, className }: TubelightNavProps) {
  const location = useLocation();

  return (
    <nav className={cn("flex items-center gap-1 relative", className)}>
      {items.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.href;
        
        return (
          <Link
            key={link.href}
            to={link.href}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="tubelight-indicator"
                className="absolute inset-0 bg-primary/10 rounded-lg"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
              />
            )}
            {isActive && (
              <motion.div
                layoutId="tubelight-glow"
                className="absolute inset-x-2 -bottom-px h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
