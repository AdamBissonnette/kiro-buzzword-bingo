import type { CardData } from '../../types';

/**
 * Callback function type for card data changes
 */
export type CardDataChangeHandler = (data: CardData) => void;

/**
 * Callback function type for card creation
 */
export type CardCreateHandler = (data: CardData) => void;

/**
 * Callback function type for variant count changes
 */
export type VariantCountChangeHandler = (count: number) => void;

/**
 * Callback function type for toggling variants display
 */
export type ToggleVariantsHandler = () => void;

/**
 * Optional callback function types
 */
export type ShareHandler = () => void;
export type RandomizeCardHandler = () => void;
export type RemixCardHandler = () => void;

/**
 * Props interface for the ControlsSidebar component.
 * This component provides a unified interface for card creation and management.
 */
export interface ControlsSidebarProps {
  /** Current card data being displayed/edited */
  cardData: CardData | null;
  
  /** Callback fired when card data changes during editing */
  onCardDataChange: CardDataChangeHandler;
  
  /** Callback fired when a new card is created */
  onCardCreate: CardCreateHandler;
  
  /** Number of card variants to generate (1-10) */
  variantCount: number;
  
  /** Callback fired when variant count changes */
  onVariantCountChange: VariantCountChangeHandler;
  
  /** Whether to show multiple card variants */
  showVariants: boolean;
  
  /** Callback to toggle variant display */
  onToggleVariants: ToggleVariantsHandler;
  
  /** Optional callback for sharing functionality */
  onShare?: ShareHandler;
  
  /** Optional callback for randomizing card arrangement */
  onRandomizeCard?: RandomizeCardHandler;
  
  /** Optional callback for remixing card with new terms */
  onRemixCard?: RemixCardHandler;
  
  /** Card DOM elements for PDF export (legacy support) */
  cardElements?: HTMLElement[];
  
  /** Container element for automatic card element detection */
  container?: HTMLElement | Document;
}

/**
 * Default values for optional props
 */
export const defaultProps: Partial<ControlsSidebarProps> = {
  variantCount: 1,
  showVariants: false,
  cardElements: [],
  onShare: undefined,
  onRandomizeCard: undefined,
  onRemixCard: undefined,
};

/**
 * Validation constraints for props
 */
export const propConstraints = {
  variantCount: {
    min: 1,
    max: 10,
  },
} as const;