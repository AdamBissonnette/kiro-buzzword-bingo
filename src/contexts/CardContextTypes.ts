import type { CardData, ValidationErrors } from '../types';

// Define the context interface based on the useCardState return type
export interface CardContextType {
  cardData: CardData | null;
  variants: CardData[];
  isEditing: boolean;
  validationErrors: ValidationErrors;
  updateCardData: (updates: Partial<CardData>) => void;
  createCard: (data: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  generateVariants: (count: number) => void;
  randomizeCard: () => void;
  validateCard: (data: Partial<CardData>) => ValidationErrors;
  clearCard: () => void;
  setEditingMode: (editing: boolean) => void;
}