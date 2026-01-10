import { cn } from '@/lib/utils';
import { CardNetwork } from '@/lib/cardCatalog';

interface CardArtworkProps {
  issuer: string;
  cardName: string;
  network: CardNetwork | string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
}

// Issuer-specific card styling
const issuerStyles: Record<string, { 
  gradient: string; 
  textColor: string; 
  pattern: 'metallic' | 'minimal' | 'premium' | 'standard';
  chipColor: string;
}> = {
  'American Express': {
    gradient: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600',
    textColor: 'text-white',
    pattern: 'metallic',
    chipColor: 'bg-amber-300',
  },
  'Chase': {
    gradient: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900',
    textColor: 'text-white',
    pattern: 'premium',
    chipColor: 'bg-yellow-400',
  },
  'Capital One': {
    gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    textColor: 'text-white',
    pattern: 'premium',
    chipColor: 'bg-yellow-400',
  },
  'Citi': {
    gradient: 'bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800',
    textColor: 'text-white',
    pattern: 'standard',
    chipColor: 'bg-yellow-400',
  },
  'Discover': {
    gradient: 'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500',
    textColor: 'text-white',
    pattern: 'standard',
    chipColor: 'bg-yellow-400',
  },
  'Bank of America': {
    gradient: 'bg-gradient-to-br from-red-700 via-red-600 to-blue-900',
    textColor: 'text-white',
    pattern: 'standard',
    chipColor: 'bg-yellow-400',
  },
  'Wells Fargo': {
    gradient: 'bg-gradient-to-br from-red-700 via-red-600 to-yellow-600',
    textColor: 'text-white',
    pattern: 'standard',
    chipColor: 'bg-yellow-400',
  },
  'U.S. Bank': {
    gradient: 'bg-gradient-to-br from-blue-800 via-blue-700 to-red-700',
    textColor: 'text-white',
    pattern: 'standard',
    chipColor: 'bg-yellow-400',
  },
  'Apple': {
    gradient: 'bg-gradient-to-br from-gray-100 via-white to-gray-200',
    textColor: 'text-gray-800',
    pattern: 'minimal',
    chipColor: 'bg-gray-300',
  },
  'Bilt': {
    gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    textColor: 'text-white',
    pattern: 'minimal',
    chipColor: 'bg-yellow-400',
  },
  'Barclays': {
    gradient: 'bg-gradient-to-br from-cyan-500 via-cyan-400 to-blue-600',
    textColor: 'text-white',
    pattern: 'standard',
    chipColor: 'bg-yellow-400',
  },
};

// Special card overrides for specific cards
const cardOverrides: Record<string, { gradient: string; textColor: string }> = {
  'Gold Card': {
    gradient: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600',
    textColor: 'text-white',
  },
  'Platinum Card': {
    gradient: 'bg-gradient-to-br from-slate-300 via-gray-200 to-slate-400',
    textColor: 'text-slate-800',
  },
  'Sapphire Reserve': {
    gradient: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900',
    textColor: 'text-white',
  },
  'Sapphire Preferred': {
    gradient: 'bg-gradient-to-br from-blue-800 via-indigo-800 to-blue-900',
    textColor: 'text-white',
  },
  'Venture X': {
    gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    textColor: 'text-white',
  },
  'Apple Card': {
    gradient: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
    textColor: 'text-gray-900',
  },
};

// Credit card standard aspect ratio: 85.6mm × 53.98mm = 1.586:1
// Physical cards have ~3mm radius on 85.6mm width = ~3.5% border radius
const sizeClasses = {
  xs: 'w-12 text-[4px]',
  sm: 'w-16 text-[5px]',
  md: 'w-24 text-[7px]',
  lg: 'w-40 text-[10px]',
  xl: 'w-64 text-xs',
};

const chipSizes = {
  xs: 'w-2 h-1.5',
  sm: 'w-2.5 h-2',
  md: 'w-4 h-3',
  lg: 'w-6 h-4',
  xl: 'w-8 h-6',
};

const networkSymbols: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  discover: 'DISC',
};

export function CardArtwork({ 
  issuer, 
  cardName, 
  network, 
  className, 
  size = 'md',
  showDetails = true 
}: CardArtworkProps) {
  // Get base styles from issuer, with card-specific overrides
  const baseStyle = issuerStyles[issuer] || {
    gradient: 'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700',
    textColor: 'text-white',
    pattern: 'standard' as const,
    chipColor: 'bg-yellow-400',
  };
  
  const cardOverride = cardOverrides[cardName];
  const gradient = cardOverride?.gradient || baseStyle.gradient;
  const textColor = cardOverride?.textColor || baseStyle.textColor;
  const pattern = baseStyle.pattern;
  const chipColor = baseStyle.chipColor;

  // Determine if we should show card number dots based on size
  const showCardNumber = size !== 'xs' && size !== 'sm';
  const showName = size === 'lg' || size === 'xl';

  return (
    <div 
      className={cn(
        gradient,
        'relative overflow-hidden flex flex-col justify-between p-1.5 shadow-lg transition-transform hover:scale-[1.02]',
        sizeClasses[size],
        className
      )}
      style={{ 
        aspectRatio: '1.586',
        borderRadius: '3.48%', // Physical card radius
      }}
    >
      {/* Pattern overlays */}
      {pattern === 'metallic' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10" />
          <div className="absolute top-0 right-0 w-2/3 h-2/3 rounded-full blur-xl bg-white/20" />
        </>
      )}
      {pattern === 'premium' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
          <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-2xl bg-white/10" />
        </>
      )}
      {pattern === 'minimal' && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5" />
      )}

      {/* Top row: Chip and Network */}
      <div className="flex items-start justify-between relative z-10">
        {/* Chip */}
        <div className={cn(chipColor, 'rounded-sm', chipSizes[size])}>
          <div className="w-full h-full grid grid-cols-3 gap-[0.5px] p-[0.5px] opacity-60">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-amber-700/40 rounded-[0.5px]" />
            ))}
          </div>
        </div>
        
        {/* Network */}
        {showDetails && (
          <span className={cn(
            'font-bold tracking-wider uppercase opacity-90',
            textColor,
            size === 'xs' ? 'text-[4px]' : size === 'sm' ? 'text-[5px]' : ''
          )}>
            {networkSymbols[network.toLowerCase()] || network.toUpperCase().slice(0, 4)}
          </span>
        )}
      </div>

      {/* Card number placeholder */}
      {showCardNumber && showDetails && (
        <div className={cn('font-mono tracking-widest opacity-70 relative z-10', textColor)}>
          •••• •••• •••• ••••
        </div>
      )}

      {/* Bottom row: Card name */}
      <div className={cn('relative z-10', textColor)}>
        <div className={cn(
          'font-semibold truncate uppercase tracking-wide',
          size === 'xs' ? 'text-[3px]' : size === 'sm' ? 'text-[4px]' : size === 'md' ? 'text-[6px]' : ''
        )}>
          {cardName}
        </div>
        {showName && (
          <div className={cn('text-[8px] opacity-70 truncate mt-0.5')}>
            {issuer}
          </div>
        )}
      </div>
    </div>
  );
}
