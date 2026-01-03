import { useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

// Import the hero card image
import amexPlatinum from '@/assets/cards/amex-platinum.webp';

interface InteractiveHeroCardProps {
  className?: string;
}

/**
 * InteractiveHeroCard - Premium 3D tilt effect card that follows mouse movement
 * Features:
 * - CSS perspective + rotateX/rotateY for 3D tilt
 * - Specular highlight that follows cursor
 * - Smooth spring animation on movement
 * - Graceful return to neutral on mouse leave
 * - Mobile fallback: static display
 */
export function InteractiveHeroCard({ className }: InteractiveHeroCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Motion values for smooth cursor tracking
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  // Spring configuration for smooth, premium feel
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  
  // Transform mouse position to rotation values
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [12, -12]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-12, 12]),
    springConfig
  );
  
  // Highlight position (follows cursor)
  const highlightX = useSpring(
    useTransform(mouseX, [0, 1], [0, 100]),
    springConfig
  );
  const highlightY = useSpring(
    useTransform(mouseY, [0, 1], [0, 100]),
    springConfig
  );
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // Spring back to center
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  return (
    <div 
      className={cn(
        "relative w-full max-w-sm perspective-[1000px]",
        className
      )}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative cursor-pointer"
      >
        {/* Main card */}
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          animate={{
            scale: isHovered ? 1.02 : 1,
            boxShadow: isHovered 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 60px -12px hsl(var(--primary) / 0.3)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Card image */}
          <img
            src={amexPlatinum}
            alt="Premium credit card"
            className="w-full aspect-[1.586/1] object-cover"
            draggable={false}
          />
          
          {/* Specular highlight overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${highlightX.get()}% ${highlightY.get()}%, rgba(255,255,255,0.25) 0%, transparent 50%)`,
            }}
          />
          
          {/* Animated specular highlight that moves with cursor */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute w-32 h-32 rounded-full blur-2xl"
                style={{
                  left: useTransform(highlightX, v => `calc(${v}% - 64px)`),
                  top: useTransform(highlightY, v => `calc(${v}% - 64px)`),
                  background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                }}
              />
            </motion.div>
          )}
          
          {/* Edge glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: isHovered 
                ? 'inset 0 0 20px rgba(255,255,255,0.1)' 
                : 'inset 0 0 0 rgba(255,255,255,0)',
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
        
        {/* Reflection/glow beneath card */}
        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl"
          animate={{
            opacity: isHovered ? 0.4 : 0.2,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(to right, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.3))',
          }}
        />
      </motion.div>
    </div>
  );
}