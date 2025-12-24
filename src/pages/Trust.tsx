import { PageLayout } from '@/components/PageLayout';
import { Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: 'Is this AI?',
    answer: 'No. CardClutch uses deterministic, rule-based logic, not machine learning or LLMs. Every recommendation is the result of explicit rules that can be audited and explained. We chose this approach intentionally because it is transparent and predictable.',
  },
  {
    question: 'Do you store my data?',
    answer: 'No. All data stays in your browser using localStorage. Your card selections and search history never leave your device. There is no server receiving your information.',
  },
  {
    question: 'Do you sell data?',
    answer: 'No. We do not collect data, so there is nothing to sell. CardClutch has no tracking, no analytics, and no third-party integrations that would expose your information.',
  },
  {
    question: 'Is this financial advice?',
    answer: 'No. CardClutch shows you reward rates and category classifications to help you choose which card to use for a specific purchase. It does not provide advice on debt management, credit building, or financial planning. Always consult a qualified professional for financial decisions.',
  },
  {
    question: 'How is this different from Credit Karma or Experian?',
    answer: 'Credit Karma and Experian are primarily lead generation platforms. They make money by recommending credit products and earning affiliate commissions. CardClutch does not recommend new cards, does not connect to your accounts, and does not try to sell you anything. We help you use what you already have, better.',
  },
  {
    question: 'Why do you not use AI for better recommendations?',
    answer: 'AI and ML models can be more powerful, but they are also opaque. When a recommendation affects your money, you deserve to know exactly why it was made. Rule-based logic lets us explain every decision clearly. We may incorporate AI in the future, but only where transparency is not compromised.',
  },
  {
    question: 'What if you get a recommendation wrong?',
    answer: 'We maintain a curated database of merchant classifications and card reward rules. If something is wrong, it is a data error that can be fixed, not a black-box mystery. We also show confidence levels: if we are uncertain, we tell you.',
  },
  {
    question: 'Will there be a paid version?',
    answer: 'We have not decided yet. If we ever charge for features, the core decision engine will remain free. We believe basic credit guidance should not be paywalled.',
  },
  {
    question: 'Can I request a feature?',
    answer: 'Yes, but we may say no. CardClutch is intentionally minimal. We only add features that clearly serve users without compromising privacy or accuracy. If a feature creates complexity or risk, we skip it.',
  },
];

export default function Trust() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Trust and FAQ
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Honest answers to reasonable questions. No marketing language.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container max-w-3xl mx-auto">
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-card rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold mb-3">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Statement */}
      <section className="py-16 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-6">
            Our commitment
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            CardClutch exists to help people make better credit decisions at the moment they matter. We will never compromise user trust for growth, revenue, or convenience. If something is not right, we will say so. If we do not know, we will tell you.
          </p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Try CardClutch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
