import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    quote: "I was using the wrong card at Costco for months. CardClutch caught it immediately and showed me exactly why.",
    name: "Maya Chen",
    title: "Graduate Student",
    context: "Saved $200+ in missed rewards",
  },
  {
    quote: "Finally, a tool that explains WHY a card is recommended. No more guessing if I'm getting the best rate.",
    name: "David Okonkwo",
    title: "Management Consultant",
    context: "Uses 5 cards strategically",
  },
  {
    quote: "The exclusions feature is a game-changer. I didn't know my grocery card doesn't work at Target.",
    name: "Sarah Kim",
    title: "Startup Founder",
    context: "Early CardClutch adopter",
  },
  {
    quote: "As someone who travels a lot, keeping track of rotating categories was impossible. This makes it simple.",
    name: "James Rodriguez",
    title: "Frequent Traveler",
    context: "7 credit cards optimized",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function TestimonialSection() {
  return (
    <section className="border-t border-border">
      <div className="container max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Trusted by Smart Spenders
          </h2>
          <p className="text-muted-foreground mb-4">
            Real people, real results
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Built with verified reward rules
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Explainable results
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              className={cn(
                "relative p-6 rounded-2xl border border-border bg-card",
                "hover:border-primary/20 hover:shadow-md transition-all duration-300"
              )}
            >
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {testimonial.context}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
