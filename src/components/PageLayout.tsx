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
    <div className="min-h-screen bg-background">
      <Header theme={theme} onThemeToggle={toggleTheme} />
      <main className="pt-14">
        {children}
      </main>
      <Footer />
    </div>
  );
}
