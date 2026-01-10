import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { Shield, Lock, Eye, Database, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const collectItems = [
  {
    label: 'Account data',
    description: 'If you create an account, we store your email address and encrypted password. That\'s it.'
  },
  {
    label: 'Wallet selections',
    description: 'The cards you add to your wallet are stored to provide personalized recommendations.'
  },
  {
    label: 'Recommendation history',
    description: 'URLs you analyze are logged (for your history only) — we don\'t share or sell this data.'
  },
];

const dontCollectItems = [
  'Credit card numbers or financial account details',
  'Purchase amounts or transaction data',
  'Browsing history beyond analyzed URLs',
  'Personal identifiable information beyond email',
  'Location data or device fingerprints',
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background dark">
      <AmbientBackground />
      <Header />
      
      <main className="pt-20 pb-16 relative z-10">
        <div className="container max-w-3xl mx-auto px-4">
          {/* Header */}
          <section className="py-16">
            <span className="font-mono-accent text-xs uppercase tracking-widest text-primary mb-6 block">
              Privacy Policy
            </span>
            <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              Your data, your control
            </h1>
            <p className="text-sm text-muted-foreground font-mono-accent">
              Last updated: December 2024
            </p>
          </section>

          {/* What We Collect */}
          <section className="py-10 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-medium text-foreground">What We Collect</h2>
            </div>
            <div className="space-y-4">
              {collectItems.map((item, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card/30"
                >
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{item.label}:</span>{' '}
                    <span className="text-muted-foreground">{item.description}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* What We Don't Collect */}
          <section className="py-10 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-medium text-foreground">What We Don't Collect</h2>
            </div>
            <ul className="space-y-3">
              {dontCollectItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Data Storage & Security */}
          <section className="py-10 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-medium text-foreground">Data Storage & Security</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card/30">
                <p className="text-sm text-muted-foreground">
                  All data is stored securely with encryption at rest and in transit. 
                  We use Row Level Security (RLS) to ensure you can only access your own data.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card/30">
                <p className="text-sm text-muted-foreground">
                  Guest users can use the analyzer without any data being stored — 
                  selections are kept in your browser's local storage only.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="py-10 border-t border-border">
            <h2 className="text-xl font-medium text-foreground mb-4">Data Sharing</h2>
            <p className="text-sm text-muted-foreground">
              We do not sell, rent, or share your personal information with third parties for 
              marketing purposes. Period.
            </p>
          </section>

          {/* Your Rights */}
          <section className="py-10 border-t border-border">
            <h2 className="text-xl font-medium text-foreground mb-4">Your Rights</h2>
            <p className="text-sm text-muted-foreground">
              You can delete your account and all associated data at any time. 
              Contact us if you need help with data export or deletion.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="py-10 border-t border-border">
            <div className="p-5 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-medium text-foreground">Disclaimer</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                CardClutch provides information for educational purposes only. 
                Credit card terms, rewards, and fees can change at any time. 
                Always verify current terms with your card issuer before making financial decisions. 
                This is not financial advice.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
