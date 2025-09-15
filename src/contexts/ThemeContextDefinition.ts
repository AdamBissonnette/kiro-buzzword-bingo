import { createContext } from 'react';
import type { ThemeContextType } from './ThemeContextTypes';

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);