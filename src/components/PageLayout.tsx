import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14">
        {children}
      </main>
      <Footer />
    </div>
  );
}
