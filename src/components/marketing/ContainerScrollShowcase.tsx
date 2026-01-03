import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SeeItInActionAnimatedDemo } from '@/components/demo/SeeItInActionAnimatedDemo';

export function ContainerScrollShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -40]);

  return (
    <section 
      ref={containerRef}
      className="border-t border-border bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden"
    >
      <div className="container max-w-6xl mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-muted-foreground">
            Paste a URL. Get your answer in seconds.
          </p>
        </motion.div>

        <motion.div
          style={{ opacity, scale, y }}
          className="max-w-3xl mx-auto"
        >
          {/* Animated Demo */}
          <SeeItInActionAnimatedDemo />
        </motion.div>

        {/* Mobile note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Works on any device. No app required.
        </motion.p>
      </div>
    </section>
  );
}
