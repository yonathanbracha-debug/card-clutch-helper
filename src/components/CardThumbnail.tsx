import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CardArtwork } from '@/components/CardArtwork';
import { CardNetwork } from '@/lib/cardCatalog';

interface CardThumbnailProps {
  issuer: string;
  cardName: string;
  network: CardNetwork | string;
  imageUrl?: string | null;
  imageAlt?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-12 h-8',
  sm: 'w-16 h-10',
  md: 'w-24 h-16',
  lg: 'w-40 h-24',
  xl: 'w-64 h-40',
};

/**
 * CardThumbnail - Displays card images with graceful fallback
 * 
 * Priority:
 * 1. Real card image (if imageUrl provided and loads successfully)
 * 2. CardArtwork fallback (premium gradient placeholder)
 */
export function CardThumbnail({ 
  issuer, 
  cardName, 
  network, 
  imageUrl,
  imageAlt,
  className, 
  size = 'md' 
}: CardThumbnailProps) {
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
      <CardArtwork
        issuer={issuer}
        cardName={cardName}
        network={network}
        size={size}
        className={className}
      />
    );
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-lg shadow-lg',
        sizeClasses[size],
        className
      )}
      style={{ aspectRatio: '1.586' }}
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
}
