// CardImage - Uses CardThumbnail with real image support and CardArtwork fallback
import { forwardRef } from 'react';
import { CardThumbnail } from '@/components/CardThumbnail';
import { CardNetwork } from '@/lib/cardCatalog';

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
  return (
    <CardThumbnail
      ref={ref}
      issuer={issuer}
      cardName={cardName}
      network={network as CardNetwork}
      imageUrl={imageUrl}
      imageAlt={imageAlt || `${cardName} by ${issuer}`}
      className={className}
      size={size}
    />
  );
});

CardImage.displayName = 'CardImage';
