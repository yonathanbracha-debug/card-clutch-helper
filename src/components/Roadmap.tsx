import { Sparkles, Chrome, LineChart, Rocket } from 'lucide-react';

const milestones = [
  {
    status: 'current',
    title: 'Smart Recommendations',
    description: 'Rule-based card recommendations for any merchant. This is the engine.',
    icon: Sparkles,
  },
  {
    status: 'next',
    title: 'Browser Extension',
    description: 'Automatic popups at checkout. The same logic, right when you need it.',
    icon: Chrome,
  },
  {
    status: 'future',
    title: 'Full Optimization',
    description: 'Sign-up bonuses, annual fee analysis, and complete credit strategy.',
    icon: LineChart,
  },
];

export function Roadmap() {
  return (
    <section className="py-20 px-4 bg-secondary/30" id="roadmap">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            What's <span className="gradient-text">Coming</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            This web app is the foundation. The CardClutch browser extension will bring this logic directly to your checkout flow.
          </p>
        </div>

        {/* Extension teaser */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-12 border-primary/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold mb-2">
                This logic will power the CardClutch browser extension
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Imagine: you're about to check out on Amazon, and a small popup appears showing exactly which card to use. That's where we're headed. This web app is the brain—the extension is the delivery mechanism.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border md:left-1/2 md:-translate-x-px" />

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div 
                key={milestone.title}
                className={`relative flex items-start gap-6 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-6 -translate-x-1/2 md:left-1/2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    milestone.status === 'current' 
                      ? 'bg-primary border-primary' 
                      : 'bg-background border-muted-foreground'
                  }`} />
                </div>

                {/* Content card */}
                <div className={`ml-12 md:ml-0 md:w-1/2 ${
                  index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'
                }`}>
                  <div className={`glass-card rounded-xl p-5 inline-block ${
                    milestone.status === 'current' ? 'border-primary/50' : ''
                  }`}>
                    <div className={`flex items-center gap-2 mb-2 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                      <milestone.icon className={`w-5 h-5 ${milestone.status === 'current' ? 'text-primary' : 'text-muted-foreground'}`} />
                      {milestone.status === 'current' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          Now
                        </span>
                      )}
                      {milestone.status === 'next' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                          Soon
                        </span>
                      )}
                      {milestone.status === 'future' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                          Later
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-1">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
