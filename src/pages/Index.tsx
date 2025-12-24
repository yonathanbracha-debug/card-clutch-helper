import { useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CardLibrary } from '@/components/CardLibrary';
import { HowItWorks } from '@/components/HowItWorks';
import { PrivacyPromise } from '@/components/PrivacyPromise';
import { Roadmap } from '@/components/Roadmap';
import { Footer } from '@/components/Footer';
import { getRecommendation, Recommendation } from '@/lib/recommendationEngine';

const Index = () => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const handleToggleCard = (cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
    // Clear recommendation when cards change
    setRecommendation(null);
  };

  const handleUrlSubmit = (url: string) => {
    const result = getRecommendation(url, selectedCards);
    setRecommendation(result);
    
    // Scroll to top to see result
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <Hero 
          onUrlSubmit={handleUrlSubmit} 
          recommendation={recommendation}
          hasSelectedCards={selectedCards.length > 0}
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
