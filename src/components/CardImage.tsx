// CardImage - Uses real images with local asset fallback and CardArtwork backup
import { forwardRef } from 'react';
import { CardThumbnail } from '@/components/CardThumbnail';
import { getLocalCardImage, isValidImageUrl } from '@/lib/cardImageAssets';

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover';

interface CardImageProps {
  issuer: string;
  cardName: string;
  network: string;
  imageUrl?: string | null;
  imageAlt?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onError?: () => void;
}

/**
 * CardImage component with multi-tier image resolution:
 * 1. Valid database image_url
 * 2. Local asset from cardImageAssets mapping
 * 3. CardArtwork fallback (gradient placeholder)
 */
export const CardImage = forwardRef<HTMLDivElement, CardImageProps>(({ 
  issuer, 
  cardName, 
  network, 
  imageUrl,
  imageAlt,
  className, 
  size = 'md', 
  onError 
}, ref) => {
  // Determine the best image URL to use
  const resolvedImageUrl = (() => {
    // Priority 1: Valid database URL
    if (isValidImageUrl(imageUrl)) {
      return imageUrl;
    }
    
    // Priority 2: Local asset mapping
    const localAsset = getLocalCardImage(cardName);
    if (localAsset) {
      return localAsset;
    }
    
    // Priority 3: CardArtwork fallback (handled by CardThumbnail)
    return null;
  })();

  return (
    <CardThumbnail
      ref={ref}
      issuer={issuer}
      cardName={cardName}
      network={network as CardNetwork}
      imageUrl={resolvedImageUrl}
      imageAlt={imageAlt || `${cardName} by ${issuer}`}
      className={className}
      size={size}
    />
  );
});

CardImage.displayName = 'CardImage';