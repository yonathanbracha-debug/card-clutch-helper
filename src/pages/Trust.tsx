import { PageLayout } from '@/components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const faqs = [
  {
    question: 'Is this AI?',
    answer: 'No. CardClutch uses deterministic, rule-based logic. Every recommendation is the result of explicit rules that can be audited and explained.',
  },
  {
    question: 'Do you store my data?',
    answer: 'No. All data stays in your browser using localStorage. Your card selections and search history never leave your device.',
  },
  {
    question: 'Do you sell data?',
    answer: 'No. We do not collect data, so there is nothing to sell. CardClutch has no tracking and no third-party integrations.',
  },
  {
    question: 'Is this financial advice?',
    answer: 'No. CardClutch shows reward rates and category classifications. It does not provide advice on debt, credit building, or financial planning.',
  },
  {
    question: 'How is this different from Credit Karma?',
    answer: 'Credit Karma makes money by recommending credit products. CardClutch does not recommend new cards, does not connect to your accounts, and does not try to sell you anything.',
  },
  {
    question: 'Why not use AI?',
    answer: 'AI can be opaque. When a recommendation affects your money, you deserve to know exactly why it was made. Rule-based logic lets us explain every decision clearly.',
  },
  {
    question: 'What if a recommendation is wrong?',
    answer: 'We maintain a curated database. If something is wrong, it is a data error that can be fixed. We also show confidence levels—if we are uncertain, we tell you.',
  },
];

export default function Trust() {
  return (
    <PageLayout>
      <section className="py-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            Trust & FAQ
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            Honest answers. No marketing language.
          </p>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="pb-6 border-b border-border last:border-0">
                <h2 className="font-medium mb-2">{faq.question}</h2>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Try the decision engine
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}