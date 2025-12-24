import { useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CardLibrary } from '@/components/CardLibrary';
import { HowItWorks } from '@/components/HowItWorks';
import { PrivacyPromise } from '@/components/PrivacyPromise';
import { Roadmap } from '@/components/Roadmap';
import { Footer } from '@/components/Footer';
import { getRecommendation, Recommendation } from '@/lib/recommendationEngine';
import { usePersistedCards } from '@/hooks/usePersistedCards';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useTheme } from '@/hooks/useTheme';

const Index = () => {
  const { selectedCards, toggleCard, lastUrl, setLastUrl } = usePersistedCards();
  const { recentSearches, addSearch, clearSearches } = useRecentSearches();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleToggleCard = (cardId: string) => {
    toggleCard(cardId);
    setRecommendation(null);
  };

  const handleUrlSubmit = (url: string) => {
    setLastUrl(url);
    const result = getRecommendation(url, selectedCards);
    setRecommendation(result);
    
    // Add to recent searches if we got a result
    if (result) {
      addSearch({
        url,
        merchantName: result.merchant?.name || 'Unknown Merchant',
        category: result.category,
        categoryLabel: result.categoryLabel,
        cardId: result.card.id,
        cardName: result.card.name,
        cardIssuer: result.card.issuer,
      });
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header theme={theme} onThemeToggle={toggleTheme} />
      
      <main className="pt-16">
        <Hero 
          onUrlSubmit={handleUrlSubmit} 
          recommendation={recommendation}
          hasSelectedCards={selectedCards.length > 0}
          lastUrl={lastUrl}
          recentSearches={recentSearches}
          onClearSearches={clearSearches}
        />
        
        <CardLibrary 
          selectedCards={selectedCards} 
          onToggleCard={handleToggleCard} 
        />
        
        <HowItWorks />
        
        <PrivacyPromise />
        
        <Roadmap />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
