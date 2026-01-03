import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ContainerScrollShowcase, 
  HowItWorksCompact 
} from '@/components/marketing';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section - Clean, Premium */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="container max-w-4xl mx-auto px-4 py-24 md:py-32 relative">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <Badge variant="outline" className="mb-4">
                No sign-up required
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Don't let the credit system use you.{' '}
                <span className="text-primary">Use it.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                Know which card maximizes your rewards before you pay.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/analyze">
                  <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25">
                    Try demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/wallet">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    Build my card vault
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Compact How It Works */}
        <HowItWorksCompact />

        {/* See It In Action - Interactive Demo */}
        <ContainerScrollShowcase />

        {/* Single Trust Line */}
        <section className="border-t border-border">
          <div className="container max-w-4xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Privacy first</p>
                  <p className="text-sm text-muted-foreground">No tracking. No data selling.</p>
                </div>
              </div>
              <div className="hidden md:block w-px h-8 bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Verified data</p>
                  <p className="text-sm text-muted-foreground">From official issuer terms.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
