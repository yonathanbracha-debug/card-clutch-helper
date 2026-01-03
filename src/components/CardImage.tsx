// Re-export CardArtwork as CardImage for backward compatibility
import { CardArtwork } from '@/components/CardArtwork';

interface CardImageProps {
  issuer: string;
  cardName: string;
  network: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onError?: () => void;
}

export function CardImage({ issuer, cardName, network, className, size = 'md', onError }: CardImageProps) {
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