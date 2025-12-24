import { Shield, Eye, Lock, Server, CheckCircle2 } from 'lucide-react';

const promises = [
  {
    icon: Eye,
    title: 'No accounts',
    description: 'Use CardClutch instantly. Zero sign-ups or passwords.',
  },
  {
    icon: Lock,
    title: 'No tracking',
    description: 'We never store your URLs, cards, or browsing history.',
  },
  {
    icon: Server,
    title: 'Runs locally',
    description: 'All logic executes in your browser. Nothing leaves your device.',
  },
];

export function PrivacyPromise() {
  return (
    <section className="py-20 px-4" id="privacy">
      <div className="container max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8 md:p-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Privacy <span className="gradient-text">First</span>
            </h2>
          </div>

          <p className="text-center text-muted-foreground max-w-lg mx-auto mb-10">
            Your financial decisions stay yours. CardClutch is designed with privacy at its core.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {promises.map((promise) => (
              <div key={promise.title} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <promise.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{promise.title}</h3>
                <p className="text-sm text-muted-foreground">{promise.description}</p>
              </div>
            ))}
          </div>

          {/* Trust statement */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>100% frontend-only. Verify it yourself.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
