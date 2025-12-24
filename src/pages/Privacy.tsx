import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Lock, Eye, Database, AlertTriangle } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="mb-12">
            <Shield className="w-12 h-12 text-primary mb-6" />
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                What We Collect
              </h2>
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Account data:</strong> If you create an account, we store your email address 
                  and encrypted password. That's it.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Wallet selections:</strong> The cards you add to your wallet are stored 
                  to provide personalized recommendations.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Recommendation history:</strong> URLs you analyze are logged 
                  (for your history only) — we don't share or sell this data.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                What We Don't Collect
              </h2>
              <ul className="space-y-2">
                {[
                  'Credit card numbers or financial account details',
                  'Purchase amounts or transaction data',
                  'Browsing history beyond analyzed URLs',
                  'Personal identifiable information beyond email',
                  'Location data or device fingerprints',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Data Storage & Security
              </h2>
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <p className="text-sm text-muted-foreground">
                  All data is stored securely using Supabase infrastructure with encryption at rest 
                  and in transit. We use Row Level Security (RLS) to ensure you can only access your own data.
                </p>
                <p className="text-sm text-muted-foreground">
                  Guest users can use the analyzer without any data being stored — 
                  selections are kept in your browser's local storage only.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Data Sharing</h2>
              <p className="text-sm text-muted-foreground">
                We do not sell, rent, or share your personal information with third parties for 
                marketing purposes. Period.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
              <p className="text-sm text-muted-foreground">
                You can delete your account and all associated data at any time. 
                Contact us if you need help with data export or deletion.
              </p>
            </section>

            <section className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                Disclaimer
              </h2>
              <p className="text-sm text-muted-foreground">
                CardClutch provides information for educational purposes only. 
                Credit card terms, rewards, and fees can change at any time. 
                Always verify current terms with your card issuer before making financial decisions. 
                This is not financial advice.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
