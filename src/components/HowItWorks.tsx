const steps = [
  {
    step: '1',
    title: 'Select your cards',
    description: 'Choose the credit cards you carry. We remember your selection.',
  },
  {
    step: '2',
    title: 'Paste a URL',
    description: 'Copy any checkout or product page. We detect the merchant automatically.',
  },
  {
    step: '3',
    title: 'Use the best card',
    description: 'Get an instant recommendation with the reasoning explained.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-4 border-t border-border" id="how-it-works">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold mb-2">
            How it works
          </h2>
          <p className="text-muted-foreground">
            Three steps. No sign-up. No tracking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-4">
                {item.step}
              </div>
              <h3 className="font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}