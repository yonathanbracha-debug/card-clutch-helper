import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Target, Shield, Heart, AlertCircle } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About CardClutch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We believe everyone deserves to understand their credit cards before they swipe.
            </p>
          </div>

          {/* Mission */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
            <div className="p-8 rounded-2xl border border-border bg-card">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Credit card rewards are powerful—but only if you understand them. Most people leave money on the table because reward structures are intentionally complex, exclusions are hidden in fine print, and the "best" card changes based on where you're shopping.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                CardClutch exists to fix that. We're building the most accurate, verified database of credit card rewards so you can spend with confidence.
              </p>
            </div>
          </section>

          {/* Values */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Target,
                  title: 'Accuracy Over Everything',
                  description: 'We verify every piece of data. If we can\'t confirm it, we say so. No guessing, no hallucinations.',
                },
                {
                  icon: Shield,
                  title: 'Privacy by Design',
                  description: 'Your data stays yours. We don\'t track purchases, sell data, or build profiles. Ever.',
                },
                {
                  icon: Heart,
                  title: 'Empowerment First',
                  description: 'We\'re here to help you use the credit system—not let it use you. Education over manipulation.',
                },
              ].map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.title} className="p-6 rounded-xl border border-border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Who We're For */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Who We're Built For</h2>
            <div className="p-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent">
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">→</span>
                  <span><strong className="text-foreground">Students</strong> learning how credit works for the first time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">→</span>
                  <span><strong className="text-foreground">First-generation credit builders</strong> navigating a system designed to confuse</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">→</span>
                  <span><strong className="text-foreground">Anyone</strong> who wants to get full value from their cards without spreadsheets</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="mb-16">
            <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-500 mb-2">Important Disclaimer</h3>
                  <p className="text-sm text-muted-foreground">
                    CardClutch is an informational tool, not financial advice. We do not guarantee the accuracy of reward information—always verify with your card issuer before making purchase decisions. We are not affiliated with any credit card issuer or financial institution.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Founder Story */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Our Story</h2>
            <div className="p-8 rounded-2xl border border-border bg-card">
              <p className="text-muted-foreground leading-relaxed">
                CardClutch started from a simple frustration: why is it so hard to know which card to use? We spent hours reading cardmember agreements, building spreadsheets, and still made mistakes.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We're building the tool we wish existed—one that gives you clear, accurate answers without the complexity. No affiliate links, no hidden agendas. Just information that helps you make better decisions.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;