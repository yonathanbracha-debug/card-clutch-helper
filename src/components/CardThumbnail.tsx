import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { CardArtwork } from '@/components/CardArtwork';

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover';

interface CardThumbnailProps {
  issuer: string;
  cardName: string;
  network: CardNetwork | string;
  imageUrl?: string | null;
  imageAlt?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// Credit card standard aspect ratio: 85.6mm × 53.98mm = 1.586:1
const CARD_ASPECT_RATIO = 1.586;

const sizeClasses = {
  xs: 'w-12',
  sm: 'w-16',
  md: 'w-24',
  lg: 'w-40',
  xl: 'w-64',
};

/**
 * CardThumbnail - Displays card images with graceful fallback
 * 
 * Priority:
 * 1. Real card image (if imageUrl provided and loads successfully)
 * 2. CardArtwork fallback (premium gradient placeholder)
 */
export const CardThumbnail = forwardRef<HTMLDivElement, CardThumbnailProps>(({ 
  issuer, 
  cardName, 
  network, 
  imageUrl,
  imageAlt,
  className, 
  size = 'md' 
}, ref) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use real image if URL provided and hasn't errored
  const shouldShowImage = imageUrl && !imageError;

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (!shouldShowImage) {
    return (
      <div ref={ref}>
        <CardArtwork
          issuer={issuer}
          cardName={cardName}
          network={network}
          size={size}
          className={className}
        />
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className={cn(
        'relative overflow-hidden shadow-lg',
        sizeClasses[size],
        className
      )}
      style={{ 
        aspectRatio: CARD_ASPECT_RATIO,
        borderRadius: '3.48%', // Physical card radius ~3mm on 85.6mm width
      }}
    >
      {/* Loading state - show CardArtwork until image loads */}
      {!imageLoaded && (
        <div className="absolute inset-0">
          <CardArtwork
            issuer={issuer}
            cardName={cardName}
            network={network}
            size={size}
          />
        </div>
      )}
      
      {/* Real card image */}
      <img
        src={imageUrl}
        alt={imageAlt || `${cardName} by ${issuer}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
});

CardThumbnail.displayName = 'CardThumbnail';
