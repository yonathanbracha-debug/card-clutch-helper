import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Lock, Eye, Database, AlertTriangle, Check } from 'lucide-react';

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
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container-main py-12">
          {/* Header */}
          <section className="py-16 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium mb-6">
              <Shield className="w-3 h-3" />
              Privacy Policy
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4">
              Your data, your control
            </h1>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
          </section>

          <div className="max-w-3xl space-y-12">
            {/* What We Collect */}
            <section className="py-8 border-t border-border">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">What we collect</h2>
              </div>
              <div className="space-y-4">
                {collectItems.map((item, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-2xl border border-border bg-card"
                  >
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">{item.label}:</span>{' '}
                      <span className="text-muted-foreground">{item.description}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* What We Don't Collect */}
            <section className="py-8 border-t border-border">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">What we don't collect</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {dontCollectItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/50">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Storage & Security */}
            <section className="py-8 border-t border-border">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Data storage &amp; security</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-2">Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    All data is stored securely with encryption at rest and in transit. 
                    We use Row Level Security to ensure you can only access your own data.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-2">Guest mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Guest users can use the analyzer without any data being stored. 
                    Selections are kept in your browser's local storage only.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="py-8 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data sharing</h2>
              <p className="text-muted-foreground">
                We do not sell, rent, or share your personal information with third parties for 
                marketing purposes. Period.
              </p>
            </section>

            {/* Your Rights */}
            <section className="py-8 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Your rights</h2>
              <p className="text-muted-foreground">
                You can delete your account and all associated data at any time. 
                Contact us if you need help with data export or deletion.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="py-8 border-t border-border">
              <div className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Disclaimer</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  CardClutch provides information for educational purposes only. 
                  Credit card terms, rewards, and fees can change at any time. 
                  Always verify current terms with your card issuer before making financial decisions. 
                  This is not financial advice.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;