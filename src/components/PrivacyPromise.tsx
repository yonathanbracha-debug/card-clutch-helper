import { Shield, Eye, Lock, Server } from 'lucide-react';

const promises = [
  {
    icon: Eye,
    title: 'No accounts required',
    description: 'Start using CardClutch instantly. No sign-ups, no passwords.',
  },
  {
    icon: Lock,
    title: 'No data stored',
    description: "We don't save your cards, URLs, or browsing history. Period.",
  },
  {
    icon: Server,
    title: 'Runs in your browser',
    description: 'All logic executes locally. Nothing ever leaves your device.',
  },
];

export function PrivacyPromise() {
  return (
    <section className="py-20 px-4" id="privacy">
      <div className="container max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8 md:p-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Privacy <span className="gradient-text">First</span>
            </h2>
          </div>

          <p className="text-center text-muted-foreground max-w-lg mx-auto mb-12">
            Your financial information is yours alone. CardClutch is built with privacy at its core.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {promises.map((promise) => (
              <div key={promise.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <promise.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{promise.title}</h3>
                <p className="text-sm text-muted-foreground">{promise.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
