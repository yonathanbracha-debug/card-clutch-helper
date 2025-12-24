import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Lock, Shield, Database, Key, CheckCircle } from 'lucide-react';

const Security = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="mb-12">
            <Lock className="w-12 h-12 text-primary mb-6" />
            <h1 className="text-3xl font-bold mb-4">Security</h1>
            <p className="text-muted-foreground">
              How we protect your data and maintain trust.
            </p>
          </div>

          <div className="space-y-8">
            <section className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Row Level Security (RLS)</h2>
                  <p className="text-sm text-muted-foreground">
                    Every database table uses Row Level Security policies. This means even if there's 
                    a bug in our code, the database itself enforces that you can only read your own data. 
                    It's defense in depth.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Encryption</h2>
                  <p className="text-sm text-muted-foreground">
                    All data is encrypted at rest using AES-256. All connections use TLS 1.3. 
                    Passwords are hashed with bcrypt with high work factors.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Principle of Least Privilege</h2>
                  <p className="text-sm text-muted-foreground">
                    Our application code only has the minimum permissions needed. 
                    Admin operations require separate elevated credentials and are audited.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl border border-primary/30 bg-primary/5">
              <h2 className="text-lg font-semibold mb-4">What We Don't Store</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  'Credit card numbers',
                  'Bank account details',
                  'Social security numbers',
                  'Purchase amounts',
                  'Transaction history',
                  'Merchant payment data',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Never stores: {item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-semibold mb-4">Infrastructure</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Hosted on Supabase (AWS infrastructure)</li>
                <li>• SOC 2 Type II compliant infrastructure</li>
                <li>• Regular security audits and penetration testing</li>
                <li>• Automatic security updates and patching</li>
              </ul>
            </section>

            <section className="p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="font-medium mb-2">Report a Security Issue</h3>
              <p className="text-sm text-muted-foreground">
                If you discover a security vulnerability, please report it responsibly. 
                We appreciate your help keeping CardClutch secure.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Security;
