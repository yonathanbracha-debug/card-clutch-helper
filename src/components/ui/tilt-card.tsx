/**
 * TiltCard - Cursor-tracked 3D tilting card with specular highlight
 * Used for premium hero card displays
 */
import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  perspective?: number;
}

export function TiltCard({ 
  children, 
  className,
  maxTilt = 15,
  scale = 1.02,
  perspective = 1000,
}: TiltCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Spring configs for smooth movement
  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const highlightX = useSpring(50, springConfig);
  const highlightY = useSpring(50, springConfig);
  
  // Transform highlight position to percentage for gradient
  const highlightStyle = useTransform(
    [highlightX, highlightY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.25) 0%, transparent 50%)`
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate percentage from center (-1 to 1)
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    
    // Set rotation (inverted for natural feel)
    rotateY.set(percentX * maxTilt);
    rotateX.set(-percentY * maxTilt);
    
    // Set highlight position (0-100%)
    highlightX.set(((e.clientX - rect.left) / rect.width) * 100);
    highlightY.set(((e.clientY - rect.top) / rect.height) * 100);
  }, [maxTilt, rotateX, rotateY, highlightX, highlightY]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    highlightX.set(50);
    highlightY.set(50);
  }, [rotateX, rotateY, highlightX, highlightY]);

  return (
    <motion.div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ perspective }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? scale : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Card content */}
        {children}
        
        {/* Specular highlight overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: highlightStyle }}
        />
      </motion.div>
      
      {/* Dynamic shadow */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-2xl"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          boxShadow: isHovered 
            ? '0 25px 50px -12px hsl(var(--primary) / 0.25), 0 12px 24px -8px rgba(0,0,0,0.2)'
            : '0 10px 30px -8px rgba(0,0,0,0.15)',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
