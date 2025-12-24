import { creditCards } from '@/lib/cardData';
import { CreditCardTile } from './CreditCardTile';

interface CardLibraryProps {
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
}

export function CardLibrary({ selectedCards, onToggleCard }: CardLibraryProps) {
  return (
    <section className="py-16 px-4" id="cards">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Your <span className="gradient-text">Card Wallet</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select the credit cards you own. We'll recommend the best one for each purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditCards.map((card) => (
            <CreditCardTile
              key={card.id}
              card={card}
              isSelected={selectedCards.includes(card.id)}
              onToggle={onToggleCard}
            />
          ))}
        </div>

        {selectedCards.length === 0 && (
          <p className="text-center text-muted-foreground mt-6 text-sm">
            Tap on cards above to add them to your wallet
          </p>
        )}
        
        {selectedCards.length > 0 && (
          <p className="text-center text-primary mt-6 text-sm font-medium">
            {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>
    </section>
  );
}
