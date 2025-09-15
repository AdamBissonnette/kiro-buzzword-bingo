import { useContext } from 'react';
import { CardContext } from './CardContextDefinition';
import { ThemeContext } from './ThemeContextDefinition';
import type { CardContextType } from './CardContextTypes';
import type { ThemeContextType } from './ThemeContextTypes';

/**
 * Custom hook to consume the CardContext.
 * 
 * This hook provides easy access to card state and actions from any component
 * within the CardProvider tree. It includes proper error handling to ensure
 * the hook is used within the correct context.
 * 
 * @returns CardContextType - All card state and management functions
 * @throws Error if used outside of CardProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { cardData, updateCardData, createCard } = useCardContext();
 *   
 *   const handleTitleChange = (title: string) => {
 *     updateCardData({ title });
 *   };
 *   
 *   return (
 *     <div>
 *       <h1>{cardData?.title || 'No card'}</h1>
 *       <button onClick={() => handleTitleChange('New Title')}>
 *         Update Title
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCardContext(): CardContextType {
  const context = useContext(CardContext);
  
  if (context === undefined) {
    throw new Error(
      'useCardContext must be used within a CardProvider. ' +
      'Make sure to wrap your component tree with <CardProvider>.'
    );
  }
  
  return context;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}