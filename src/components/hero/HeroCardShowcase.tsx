/**
 * HeroCardShowcase - 3D tilting Amex Gold card for hero section
 * Replaces generic Spline scene with a cursor-tracked card
 */
import { motion } from 'framer-motion';
import { TiltCard } from '@/components/ui/tilt-card';
import { getLocalCardImage } from '@/lib/cardImageAssets';
import { CheckCircle } from 'lucide-react';

// Features shown next to the card
const features = [
  "Real reward rules.",
  "Category traps flagged.",
  "Best card, instantly.",
];

export function HeroCardShowcase() {
  // Get Amex Gold card image from local assets
  const cardImage = getLocalCardImage('Gold Card') || getLocalCardImage('amex-gold');

  return (
    <div className="relative flex flex-col items-center lg:items-end gap-6">
      {/* The 3D Tilting Card */}
      <TiltCard className="w-full max-w-[340px] aspect-[1.586/1]">
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-amber-500/10 via-background to-amber-900/10">
          {cardImage ? (
            <img
              src={cardImage}
              alt="American Express Gold Card"
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            /* Fallback gradient card */
            <div className="w-full h-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center">
              <span className="text-white/80 font-semibold text-lg">Amex Gold</span>
            </div>
          )}
        </div>
      </TiltCard>

      {/* Feature bullets */}
      <motion.ul 
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, staggerChildren: 0.1 }}
      >
        {features.map((feature, i) => (
          <motion.li
            key={feature}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span>{feature}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
