import { Shield, Eye, Server } from 'lucide-react';

const promises = [
  {
    icon: Eye,
    title: 'No accounts',
    description: 'Use CardClutch instantly. No sign-up required.',
  },
  {
    icon: Shield,
    title: 'No tracking',
    description: 'We never store your URLs or browsing history.',
  },
  {
    icon: Server,
    title: 'Runs locally',
    description: 'All logic runs in your browser. Nothing leaves your device.',
  },
];

export function PrivacyPromise() {
  return (
    <section className="py-16 px-4 bg-secondary/50" id="privacy">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold mb-2">
            Privacy by design
          </h2>
          <p className="text-muted-foreground">
            Your financial decisions stay yours.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {promises.map((promise) => (
            <div key={promise.title} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border mb-3">
                <promise.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">{promise.title}</h3>
              <p className="text-sm text-muted-foreground">{promise.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}