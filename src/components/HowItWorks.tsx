import { Wallet, Link, Zap } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Add your cards',
    description: 'Select which credit cards you own from our library. We support the most popular rewards cards.',
  },
  {
    icon: Link,
    title: 'Paste a shopping link',
    description: 'Copy the URL from any online store. We identify the merchant and their category automatically.',
  },
  {
    icon: Zap,
    title: 'Get the best card',
    description: "We instantly analyze your cards' rewards and recommend which one maximizes your earnings.",
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
            Three simple steps to never miss a reward again.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.title} 
              className="relative glass-card rounded-2xl p-8 text-center group hover:border-primary/30 transition-colors"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>

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
