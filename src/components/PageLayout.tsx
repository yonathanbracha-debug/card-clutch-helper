import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useTheme } from '@/hooks/useTheme';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header theme={theme} onThemeToggle={toggleTheme} />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
