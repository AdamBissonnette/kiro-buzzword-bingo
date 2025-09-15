import { createContext } from 'react';
import type { CardContextType } from './CardContextTypes';

// Create the context with undefined as default (will be provided by CardProvider)
export const CardContext = createContext<CardContextType | undefined>(undefined);