import { Wallet, Link, Zap, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Select your cards',
    description: 'Choose from popular rewards cards. We remember your selection.',
  },
  {
    icon: Link,
    title: 'Paste a checkout URL',
    description: 'Copy any shopping URL. We detect the merchant automatically.',
  },
  {
    icon: Zap,
    title: 'Use the best card',
    description: 'Get an instant recommendation with clear reasoning.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-secondary/30" id="how-it-works">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three steps. No sign-up. No tracking. Just smarter spending.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div 
              key={step.title} 
              className="relative glass-card rounded-2xl p-8 text-center group hover:border-primary/30 transition-colors"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>

              {/* Arrow connector (hidden on mobile, shown on md+) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-muted items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </div>
              )}

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
