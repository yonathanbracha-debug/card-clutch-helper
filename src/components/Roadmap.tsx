import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

const milestones = [
  {
    status: 'current',
    title: 'Smart Recommendations',
    description: 'Rule-based card recommendations for any merchant URL.',
    icon: Sparkles,
  },
  {
    status: 'next',
    title: 'Browser Extension',
    description: 'Get recommendations automatically while you shop online.',
    icon: Circle,
  },
  {
    status: 'future',
    title: 'Full Optimization',
    description: 'Complete credit card strategy with sign-up bonuses and annual fee analysis.',
    icon: Circle,
  },
];

export function Roadmap() {
  return (
    <section className="py-20 px-4 bg-secondary/30" id="roadmap">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            What's <span className="gradient-text">Next</span>
          </h2>
          <p className="text-muted-foreground">
            CardClutch is just getting started.
          </p>
        </div>

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
                    {milestone.status === 'current' && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-2">
                        Now
                      </span>
                    )}
                    {milestone.status === 'next' && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full mb-2">
                        Coming Soon
                      </span>
                    )}
                    {milestone.status === 'future' && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full mb-2">
                        Later
                      </span>
                    )}
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
