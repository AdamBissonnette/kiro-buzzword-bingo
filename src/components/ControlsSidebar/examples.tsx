import React, { useState } from 'react';
import { ControlsSidebar } from './ControlsSidebar';
import type { CardData } from '../../types';

/**
 * Basic usage example of ControlsSidebar component
 */
export const BasicControlsSidebarExample: React.FC = () => {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [variantCount, setVariantCount] = useState(1);
  const [showVariants, setShowVariants] = useState(false);

  const handleCardDataChange = (data: CardData) => {
    setCardData(data);
  };

  const handleCardCreate = (data: CardData) => {
    console.log('Card created:', data);
    setCardData(data);
  };

  const handleVariantCountChange = (count: number) => {
    setVariantCount(count);
  };

  const handleToggleVariants = () => {
    setShowVariants(!showVariants);
  };

  const handleShare = () => {
    console.log('Sharing card:', cardData);
  };

  const handleRandomizeCard = () => {
    if (cardData) {
      const shuffledTerms = [...cardData.terms].sort(() => Math.random() - 0.5);
      setCardData({
        ...cardData,
        terms: shuffledTerms,
        updatedAt: new Date()
      });
    }
  };

  return (
    <ControlsSidebar
      cardData={cardData}
      onCardDataChange={handleCardDataChange}
      onCardCreate={handleCardCreate}
      variantCount={variantCount}
      onVariantCountChange={handleVariantCountChange}
      showVariants={showVariants}
      onToggleVariants={handleToggleVariants}
      onShare={handleShare}
      onRandomizeCard={handleRandomizeCard}
    />
  );
};

/**
 * Minimal usage example with only required props
 */
export const MinimalControlsSidebarExample: React.FC = () => {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [variantCount, setVariantCount] = useState(1);
  const [showVariants, setShowVariants] = useState(false);

  return (
    <ControlsSidebar
      cardData={cardData}
      onCardDataChange={setCardData}
      onCardCreate={(data) => console.log('Created:', data)}
      variantCount={variantCount}
      onVariantCountChange={setVariantCount}
      showVariants={showVariants}
      onToggleVariants={() => setShowVariants(!showVariants)}
    />
  );
};

/**
 * Advanced usage example with all optional props
 */
export const AdvancedControlsSidebarExample: React.FC = () => {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [variantCount, setVariantCount] = useState(3);
  const [showVariants, setShowVariants] = useState(true);
  const [cardElements] = useState<HTMLElement[]>([]);

  const handleRemixCard = () => {
    if (cardData) {
      // Example remix logic - add some random terms
      const newTerms = [
        ...cardData.terms,
        'Synergy',
        'Paradigm Shift',
        'Low-hanging Fruit'
      ].slice(0, 24);
      
      setCardData({
        ...cardData,
        terms: newTerms,
        updatedAt: new Date()
      });
    }
  };

  return (
    <ControlsSidebar
      cardData={cardData}
      onCardDataChange={setCardData}
      onCardCreate={(data) => {
        console.log('Created card:', data);
        setCardData(data);
      }}
      variantCount={variantCount}
      onVariantCountChange={setVariantCount}
      showVariants={showVariants}
      onToggleVariants={() => setShowVariants(!showVariants)}
      onShare={() => alert('Sharing functionality would go here')}
      onRandomizeCard={() => {
        if (cardData) {
          const shuffled = [...cardData.terms].sort(() => Math.random() - 0.5);
          setCardData({ ...cardData, terms: shuffled, updatedAt: new Date() });
        }
      }}
      onRemixCard={handleRemixCard}
      cardElements={cardElements}
    />
  );
};