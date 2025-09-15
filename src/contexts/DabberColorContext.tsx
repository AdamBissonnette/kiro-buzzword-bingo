import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { DabberColor } from '../data/dabberColors';
import { defaultDabberColor, dabberColors } from '../data/dabberColors';

interface DabberColorContextType {
  selectedColor: DabberColor;
  setSelectedColor: (color: DabberColor) => void;
  availableColors: DabberColor[];
}

const DabberColorContext = createContext<DabberColorContextType | undefined>(undefined);

interface DabberColorProviderProps {
  children: ReactNode;
}

export function DabberColorProvider({ children }: DabberColorProviderProps) {
  const [selectedColor, setSelectedColorState] = useState<DabberColor>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('dabberColor');
    if (saved) {
      try {
        const savedColor = JSON.parse(saved);
        // Verify the saved color still exists in our available colors
        const foundColor = dabberColors.find(color => color.id === savedColor.id);
        return foundColor || defaultDabberColor;
      } catch {
        return defaultDabberColor;
      }
    }
    return defaultDabberColor;
  });

  const setSelectedColor = (color: DabberColor) => {
    setSelectedColorState(color);
    localStorage.setItem('dabberColor', JSON.stringify(color));
    
    // Update CSS custom property for the dabber color
    document.documentElement.style.setProperty('--dabber-color', color.color);
  };

  // Set initial CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--dabber-color', selectedColor.color);
  }, [selectedColor.color]);

  return (
    <DabberColorContext.Provider 
      value={{ 
        selectedColor, 
        setSelectedColor, 
        availableColors: dabberColors 
      }}
    >
      {children}
    </DabberColorContext.Provider>
  );
}

export function useDabberColor() {
  const context = useContext(DabberColorContext);
  if (context === undefined) {
    throw new Error('useDabberColor must be used within a DabberColorProvider');
  }
  return context;
}

export default DabberColorProvider;