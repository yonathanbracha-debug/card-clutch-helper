import { creditCards } from '@/lib/cardData';
import { CreditCardTile } from './CreditCardTile';
import { Wallet } from 'lucide-react';

interface CardLibraryProps {
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
}

export function CardLibrary({ selectedCards, onToggleCard }: CardLibraryProps) {
  return (
    <section className="py-20 px-4" id="cards">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Wallet className="w-8 h-8 text-primary" />
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Your <span className="gradient-text">Card Vault</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Tap to select the credit cards you own. CardClutch will recommend the best one for each purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditCards.map((card) => (
            <CreditCardTile
              key={card.id}
              card={card}
              isSelected={selectedCards.includes(card.id)}
              onToggle={onToggleCard}
            />
          ))}
        </div>

        <div className="text-center mt-8">
          {selectedCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Tap on cards above to add them to your vault
            </p>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} in your vault
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
