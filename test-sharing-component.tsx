import React, { useEffect, useState } from 'react';
import { getCardDataFromUrl } from './src/utils/urlEncoder';
import type { CardData } from './src/types';

// Simple test component to verify sharing functionality
const TestSharingComponent: React.FC = () => {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Check if we have shared card data in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const playParam = urlParams.get('play');
      const dataParam = urlParams.get('data');
      
      console.log('URL params:', { play: playParam, data: dataParam });
      
      if (playParam === 'true' && dataParam) {
        console.log('Attempting to load shared card data...');
        const sharedCardData = getCardDataFromUrl();
        
        if (sharedCardData) {
          console.log('Successfully loaded shared card:', sharedCardData);
          setCardData(sharedCardData);
        } else {
          setError('Failed to parse shared card data from URL');
        }
      } else {
        console.log('No shared card data found in URL');
        setError('No shared card data found in URL');
      }
    } catch (err) {
      console.error('Error loading shared card:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <div>Loading shared card...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error Loading Shared Card</h2>
        <p>{error}</p>
        <p>Current URL: {window.location.href}</p>
      </div>
    );
  }

  if (cardData) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>✅ Shared Card Loaded Successfully!</h2>
        <h3>Title: {cardData.title}</h3>
        <p><strong>Number of terms:</strong> {cardData.terms.length}</p>
        <p><strong>Free space icon:</strong> {cardData.freeSpaceIcon || 'None'}</p>
        <details>
          <summary>View all terms</summary>
          <ul>
            {cardData.terms.map((term, index) => (
              <li key={index}>{term}</li>
            ))}
          </ul>
        </details>
      </div>
    );
  }

  return <div>No card data available</div>;
};

export default TestSharingComponent;