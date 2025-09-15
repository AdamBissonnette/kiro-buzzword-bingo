import type { ReactNode } from 'react';
import { useCardState } from '../hooks/useCardState';
import { CardContext } from './CardContextDefinition';

// Props interface for the CardProvider component
interface CardProviderProps {
  children: ReactNode;
}

/**
 * CardProvider component that wraps the useCardState hook and provides
 * card state management to all child components through React Context.
 * 
 * This provider should be placed at the root level of the application
 * or at least above any components that need access to card state.
 */
export function CardProvider({ children }: CardProviderProps) {
  // Use the existing useCardState hook to manage all card-related state
  const cardState = useCardState();

  return (
    <CardContext.Provider value={cardState}>
      {children}
    </CardContext.Provider>
  );
}



export default CardProvider;