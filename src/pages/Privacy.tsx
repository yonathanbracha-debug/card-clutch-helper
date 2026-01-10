import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AmbientBackground } from '@/components/marketing/AmbientBackground';
import { Shield, Lock, Eye, Database, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const collectItems = [
  {
    label: 'Account data',
    description: 'If you create an account, we store your email address and encrypted password.'
  },
  {
    label: 'Wallet selections',
    description: 'The cards you add to your wallet are stored to provide personalized recommendations.'
  },
  {
    label: 'Recommendation history',
    description: 'URLs you analyze are logged for your history only. We do not share or sell this data.'
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
    <div className="min-h-screen bg-background">
      <AmbientBackground />
      <Header />
      
      <main className="pt-14 pb-16 relative z-10">
        <div className="max-w-2xl mx-auto px-6">
          {/* Header */}
          <section className="py-20">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-6">
              Privacy Policy
            </p>
            <h1 className="text-3xl font-light text-foreground mb-4">
              Your data, your control
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              Last updated: December 2024
            </p>
          </section>

          {/* What We Collect */}
          <section className="py-12 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">What we collect</h2>
            </div>
            <div className="space-y-4">
              {collectItems.map((item, index) => (
                <div 
                  key={index}
                  className="p-4 rounded border border-border bg-card"
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
          <section className="py-12 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">What we don't collect</h2>
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
          <section className="py-12 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">Data storage &amp; security</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded border border-border bg-card">
                <p className="text-sm text-muted-foreground">
                  All data is stored securely with encryption at rest and in transit. 
                  We use Row Level Security to ensure you can only access your own data.
                </p>
              </div>
              <div className="p-4 rounded border border-border bg-card">
                <p className="text-sm text-muted-foreground">
                  Guest users can use the analyzer without any data being stored. 
                  Selections are kept in your browser's local storage only.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="py-12 border-t border-border">
            <h2 className="text-lg font-medium text-foreground mb-4">Data sharing</h2>
            <p className="text-sm text-muted-foreground">
              We do not sell, rent, or share your personal information with third parties for 
              marketing purposes.
            </p>
          </section>

          {/* Your Rights */}
          <section className="py-12 border-t border-border">
            <h2 className="text-lg font-medium text-foreground mb-4">Your rights</h2>
            <p className="text-sm text-muted-foreground">
              You can delete your account and all associated data at any time. 
              Contact us if you need help with data export or deletion.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="py-12 border-t border-border">
            <div className="p-5 rounded border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-medium text-foreground">Disclaimer</h2>
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
