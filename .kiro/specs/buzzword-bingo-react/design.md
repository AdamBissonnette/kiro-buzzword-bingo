# Design Document

## Overview

The Buzzword Bingo React App will be built as a single-page application using modern React with functional components and hooks. The application will maintain all functionality client-side using browser APIs for sharing and PDF generation. The architecture will be modular and extensible to support future database integration and user authentication.

## Architecture

### Technology Stack
- **Frontend Framework:** React 18+ with functional components and hooks
- **Build Tool:** Vite for fast development and optimized builds
- **Styling:** CSS Modules or Styled Components for component-scoped styling
- **PDF Generation:** jsPDF with html2canvas for client-side PDF creation
- **URL Sharing:** Browser URL API with base64 encoding for card data
- **State Management:** React useState and useContext for local state management
- **Routing:** React Router for navigation between create/play modes

### Application Structure
```
src/
├── components/
│   ├── BingoCard/
│   ├── CardCreator/
│   ├── CardVariants/
│   ├── ShareModal/
│   └── ExportControls/
├── hooks/
│   ├── useBingoCard.js
│   ├── useCardSharing.js
│   └── usePDFExport.js
├── utils/
│   ├── cardGenerator.js
│   ├── urlEncoder.js
│   └── pdfExporter.js
├── contexts/
│   └── BingoContext.js
└── App.js
```

## Components and Interfaces

### Core Components

#### BingoCard Component
**Purpose:** Renders a single 5x5 bingo card with interactive squares
**Props:**
- `title: string` - Card title
- `terms: string[]` - Array of bingo terms
- `freeSpaceImage?: string` - URL for free space image
- `isPlayMode: boolean` - Whether card is in play mode (clickable)
- `onSquareClick?: (index: number) => void` - Handler for square clicks

**State:**
- `clickedSquares: Set<number>` - Tracks which squares are marked

#### CardCreator Component
**Purpose:** Form interface for creating new bingo cards
**Props:**
- `onCardCreate: (cardData: CardData) => void` - Callback when card is created

**State:**
- `title: string` - Card title input
- `terms: string` - Textarea content for terms
- `freeSpaceImage: string` - Free space image URL
- `errors: ValidationErrors` - Form validation errors

#### CardVariants Component
**Purpose:** Displays multiple randomized versions of a bingo card
**Props:**
- `cardData: CardData` - Base card configuration
- `variantCount: number` - Number of variants to generate

**State:**
- `variants: CardData[]` - Generated card variants

#### ShareModal Component
**Purpose:** Provides sharing options and URL generation
**Props:**
- `cardData: CardData` - Card to share
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close handler

#### ExportControls Component
**Purpose:** PDF export functionality and options
**Props:**
- `cards: CardData[]` - Cards to export
- `onExport: () => void` - Export handler

### Data Interfaces

```typescript
interface CardData {
  title: string;
  terms: string[];
  freeSpaceImage?: string;
  arrangement?: number[]; // Randomized term indices
}

interface ValidationErrors {
  title?: string;
  terms?: string;
  freeSpaceImage?: string;
}

interface ShareConfig {
  url: string;
  qrCode?: string;
}
```

## Data Models

### Card Generation Logic
- **Term Shuffling:** Fisher-Yates shuffle algorithm for random term arrangement
- **Grid Population:** 5x5 grid with center (index 12) reserved for free space
- **Variant Generation:** Multiple shuffles of the same term set
- **Validation:** Minimum 24 terms required (25 squares minus free space)

### URL Encoding Strategy
- **Base64 Encoding:** Card data encoded as base64 JSON in URL parameters
- **Compression:** Use LZ-string compression for large term lists
- **URL Structure:** `/#/play?data={encodedCardData}`
- **Fallback:** Graceful degradation if URL becomes too long

### PDF Generation Approach
- **HTML to Canvas:** Use html2canvas to capture card visual representation
- **Canvas to PDF:** Convert canvas to PDF using jsPDF
- **Multi-page Support:** Automatic page breaks for multiple variants
- **Print Optimization:** Ensure proper sizing for standard paper formats

## Error Handling

### Validation Errors
- **Term Count:** Display error if fewer than 24 terms provided
- **Empty Fields:** Highlight required fields that are empty
- **Image URLs:** Validate image URLs and provide fallback for invalid ones
- **Real-time Feedback:** Show validation status as user types

### Runtime Errors
- **PDF Generation Failures:** Catch and display user-friendly error messages
- **URL Parsing Errors:** Handle malformed shared URLs gracefully
- **Image Loading Errors:** Provide default free space image if custom image fails
- **Browser Compatibility:** Feature detection for unsupported browsers

### Error Recovery
- **Auto-save:** Preserve user input in localStorage to prevent data loss
- **Retry Mechanisms:** Allow users to retry failed operations
- **Fallback Options:** Provide alternative methods when primary features fail

## Testing Strategy

### Unit Testing
- **Component Testing:** React Testing Library for component behavior
- **Utility Functions:** Jest tests for card generation and URL encoding
- **Hook Testing:** Custom hook testing with react-hooks-testing-library
- **Validation Logic:** Comprehensive tests for form validation

### Integration Testing
- **User Workflows:** End-to-end testing of create → share → play flow
- **PDF Generation:** Test PDF output quality and content accuracy
- **URL Sharing:** Verify shared URLs properly reconstruct cards
- **Cross-browser Testing:** Ensure compatibility across major browsers

### Performance Testing
- **Large Term Lists:** Test with maximum expected number of terms
- **Multiple Variants:** Performance with 10+ card variants
- **PDF Generation Time:** Measure and optimize export performance
- **Memory Usage:** Monitor for memory leaks during extended use

## Implementation Phases

### Phase 1: Core Functionality
- Basic React app setup with Vite
- BingoCard component with static data
- CardCreator form with validation
- Simple card generation and display

### Phase 2: Advanced Features
- Multiple variant generation
- URL-based sharing mechanism
- PDF export functionality
- Responsive design implementation

### Phase 3: Polish and Optimization
- Error handling and user feedback
- Performance optimizations
- Cross-browser compatibility
- Accessibility improvements

### Phase 4: Future Extensibility
- Context API setup for state management
- Component structure for user authentication
- API abstraction layer for future backend integration
- Local storage management for user preferences