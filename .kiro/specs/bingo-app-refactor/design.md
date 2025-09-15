# Design Document

## Overview

This design outlines the architectural changes needed to refactor the Buzzword Bingo application into a unified, sidebar-based interface with centralized state management, improved multiple card rendering, reliable PDF export, and cleaned-up codebase.

## Architecture

### High-Level Architecture Changes

```
Current Architecture:
App -> CardCreator (separate view) -> BingoCard (preview)
    -> ControlsSidebar (limited functionality)

New Architecture:
App -> Layout (unified interface)
    -> ControlsSidebar (integrated card creation + management)
    -> MainContent (always-visible preview + variants)
```

### State Management Strategy

The application will use React's built-in state management with a centralized approach:

1. **App-level state** for core card data and application mode
2. **Context providers** for shared state between components
3. **Custom hooks** for complex state logic and side effects

### Component Hierarchy

```
App
├── ThemeProvider
├── ErrorBoundary
└── Layout
    ├── Header (navigation, theme toggle)
    ├── ControlsSidebar (card creation + management)
    │   ├── CardCreationForm
    │   ├── CardActions
    │   └── ExportControls
    └── MainContent
        ├── SingleCardView (BingoCard preview)
        └── MultipleCardsView (horizontal card row)
```

## Components and Interfaces

### 1. Enhanced ControlsSidebar Component

**Purpose:** Unified sidebar containing card creation form and management controls

**Key Features:**
- Integrated card creation form (title, terms, free space icon)
- Real-time validation and preview updates
- Card management actions (randomize, regenerate, share)
- Export controls with variant selection
- Responsive design for mobile

**Interface:**
```typescript
interface ControlsSidebarProps {
  cardData: CardData | null;
  onCardDataChange: (data: CardData) => void;
  onCardCreate: (data: CardData) => void;
  variantCount: number;
  onVariantCountChange: (count: number) => void;
  showVariants: boolean;
  onToggleVariants: () => void;
}
```

### 2. Centralized Card State Hook

**Purpose:** Custom hook to manage card data and related operations

```typescript
interface UseCardStateReturn {
  cardData: CardData | null;
  variants: CardData[];
  isEditing: boolean;
  validationErrors: ValidationErrors;
  updateCardData: (updates: Partial<CardData>) => void;
  createCard: (data: CardData) => void;
  generateVariants: (count: number) => void;
  randomizeCard: () => void;
}
```

### 3. Enhanced MainContent Component

**Purpose:** Display area for card preview and variants

**Features:**
- Always-visible card preview during creation
- Horizontal scrollable layout for multiple cards
- Responsive design with proper spacing
- Clear variant labeling

### 4. Improved PDF Export System

**Purpose:** Reliable PDF generation without hanging

**Key Improvements:**
- Better error handling and user feedback
- Optimized canvas rendering
- Progress indicators for multi-card exports
- Retry mechanisms for failed exports

## Data Models

### Enhanced CardData Interface

```typescript
interface CardData {
  id: string;
  title: string;
  terms: string[];
  freeSpaceIcon?: string;
  freeSpaceImage?: string;
  arrangement?: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface ValidationErrors {
  title?: string;
  terms?: string;
  general?: string;
}

interface AppState {
  currentCard: CardData | null;
  variants: CardData[];
  variantCount: number;
  showVariants: boolean;
  isCreating: boolean;
  validationErrors: ValidationErrors;
}
```

## Error Handling

### Validation Strategy
1. **Real-time validation** for form inputs
2. **Debounced validation** to avoid excessive re-renders
3. **Clear error messages** with actionable guidance
4. **Progressive validation** (show errors only after user interaction)

### PDF Export Error Handling
1. **Pre-export validation** of card elements
2. **Progress tracking** with cancellation options
3. **Detailed error messages** for troubleshooting
4. **Automatic retry** for transient failures

## Testing Strategy

### Unit Tests
- Card state management hooks
- Validation logic
- PDF export utilities
- Component rendering and interactions

### Integration Tests
- Card creation workflow
- Multi-card generation and display
- PDF export process
- State synchronization between components

### End-to-End Tests
- Complete card creation and export workflow
- Responsive design functionality
- Error handling scenarios

## Performance Considerations

### Optimization Strategies
1. **Debounced updates** for real-time preview
2. **Memoized components** to prevent unnecessary re-renders
3. **Lazy loading** for variant generation
4. **Optimized PDF rendering** with canvas reuse

### Memory Management
1. **Cleanup of event listeners** and timers
2. **Proper disposal** of canvas elements
3. **Efficient state updates** to minimize memory usage

## Migration Strategy

### Phase 1: State Management Refactor
- Implement centralized card state hook
- Update existing components to use new state management
- Maintain existing UI during transition

### Phase 2: UI Consolidation
- Move CardCreator functionality into ControlsSidebar
- Update App component to use unified layout
- Implement new MainContent component

### Phase 3: Multiple Card Layout
- Implement horizontal card row layout
- Update variant generation and display
- Ensure responsive design

### Phase 4: PDF Export Fixes
- Implement improved PDF export system
- Add proper error handling and progress indicators
- Test export functionality thoroughly

### Phase 5: Code Cleanup
- Remove unused components and files
- Clean up imports and dependencies
- Update tests and documentation

## Security Considerations

### Input Validation
- Sanitize user input for card titles and terms
- Validate file uploads for free space images
- Prevent XSS attacks through proper escaping

### Export Security
- Validate canvas content before PDF generation
- Implement proper error boundaries
- Sanitize filenames for downloads

## Accessibility

### WCAG Compliance
- Proper ARIA labels for form controls
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### Responsive Design
- Mobile-first approach
- Touch-friendly interface elements
- Proper viewport handling
- Accessible color schemes