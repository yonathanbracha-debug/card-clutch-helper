import { cn } from '@/lib/utils';

interface CardImageProps {
  issuer: string;
  cardName: string;
  network: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Issuer-specific gradients and colors
const issuerStyles: Record<string, { gradient: string; textColor: string; accent: string }> = {
  'American Express': {
    gradient: 'from-blue-600 via-blue-500 to-blue-400',
    textColor: 'text-white',
    accent: 'bg-white/20'
  },
  'Chase': {
    gradient: 'from-blue-900 via-blue-800 to-blue-700',
    textColor: 'text-white',
    accent: 'bg-white/15'
  },
  'Capital One': {
    gradient: 'from-gray-900 via-gray-800 to-red-900',
    textColor: 'text-white',
    accent: 'bg-red-500/30'
  },
  'Citi': {
    gradient: 'from-blue-700 via-blue-600 to-blue-500',
    textColor: 'text-white',
    accent: 'bg-white/20'
  },
  'Discover': {
    gradient: 'from-orange-500 via-orange-400 to-orange-300',
    textColor: 'text-white',
    accent: 'bg-white/25'
  },
  'Bank of America': {
    gradient: 'from-red-700 via-red-600 to-blue-700',
    textColor: 'text-white',
    accent: 'bg-white/15'
  },
  'Wells Fargo': {
    gradient: 'from-red-800 via-red-700 to-yellow-600',
    textColor: 'text-white',
    accent: 'bg-yellow-400/20'
  },
  'U.S. Bank': {
    gradient: 'from-blue-800 via-blue-700 to-red-600',
    textColor: 'text-white',
    accent: 'bg-white/15'
  },
  'Apple': {
    gradient: 'from-gray-100 via-gray-50 to-white',
    textColor: 'text-gray-800',
    accent: 'bg-gray-200/50'
  },
  'Amazon': {
    gradient: 'from-gray-900 via-gray-800 to-gray-700',
    textColor: 'text-white',
    accent: 'bg-orange-500/30'
  },
};

const sizeClasses = {
  sm: 'w-16 h-10 rounded-md text-[6px]',
  md: 'w-24 h-16 rounded-lg text-[8px]',
  lg: 'w-48 h-32 rounded-xl text-xs',
};

export function CardImage({ issuer, cardName, network, className, size = 'md' }: CardImageProps) {
  const style = issuerStyles[issuer] || {
    gradient: 'from-gray-700 via-gray-600 to-gray-500',
    textColor: 'text-white',
    accent: 'bg-white/15'
  };

  const networkSymbols: Record<string, string> = {
    'visa': 'VISA',
    'mastercard': 'MC',
    'amex': 'AMEX',
    'discover': 'DISC',
  };

  return (
    <div 
      className={cn(
        `bg-gradient-to-br ${style.gradient} relative overflow-hidden flex flex-col justify-between p-2 shadow-lg`,
        sizeClasses[size],
        className
      )}
    >
      {/* Decorative elements */}
      <div className={cn("absolute top-0 right-0 w-1/2 h-1/2 rounded-full blur-xl opacity-30", style.accent)} />
      <div className={cn("absolute bottom-0 left-0 w-1/3 h-1/3 rounded-full blur-lg opacity-20", style.accent)} />
      
      {/* Chip */}
      <div className="flex items-start justify-between relative z-10">
        <div className={cn(
          "bg-yellow-400/80 rounded-sm",
          size === 'sm' ? 'w-3 h-2' : size === 'md' ? 'w-4 h-3' : 'w-8 h-6'
        )}>
          <div className="w-full h-full grid grid-cols-3 gap-[1px] p-[1px]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-yellow-600/50 rounded-[1px]" />
            ))}
          </div>
        </div>
        <span className={cn("font-bold tracking-wider", style.textColor, size === 'sm' ? 'text-[5px]' : '')}>
          {networkSymbols[network.toLowerCase()] || network.toUpperCase()}
        </span>
      </div>

      {/* Card info */}
      <div className={cn("relative z-10", style.textColor)}>
        <div className={cn("font-mono tracking-widest mb-1", size === 'lg' ? 'text-sm' : '')}>
          •••• •••• •••• ••••
        </div>
        <div className={cn("font-medium truncate", size === 'sm' ? 'text-[5px]' : size === 'md' ? 'text-[7px]' : 'text-xs')}>
          {cardName}
        </div>
      </div>
    </div>
  );
}