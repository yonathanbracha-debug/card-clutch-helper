// Re-export CardArtwork as CardImage for backward compatibility
import { CardArtwork } from '@/components/CardArtwork';

interface CardImageProps {
  issuer: string;
  cardName: string;
  network: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CardImage({ issuer, cardName, network, className, size = 'md' }: CardImageProps) {
  return (
    <CardArtwork
      issuer={issuer}
      cardName={cardName}
      network={network}
      className={className}
      size={size}
    />
  );
}