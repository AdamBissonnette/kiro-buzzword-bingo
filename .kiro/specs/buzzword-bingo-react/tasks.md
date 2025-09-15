# Implementation Plan

- [x] 1. Set up React project foundation
  - Initialize Vite React project with TypeScript support
  - Configure project structure with components, hooks, utils, and contexts directories
  - Install and configure essential dependencies (react-router-dom, jspdf, html2canvas)
  - Set up basic CSS modules configuration
  - _Requirements: 7.1, 7.5_

- [x] 2. Create core data models and utilities
  - Implement CardData interface and related TypeScript types
  - Create cardGenerator utility with Fisher-Yates shuffle algorithm
  - Implement term validation functions (minimum 24 terms check)
  - Write unit tests for card generation and validation utilities
  - _Requirements: 1.2, 1.3, 2.1, 2.2_

- [x] 3. Build basic BingoCard component
  - Create BingoCard component with 5x5 grid layout
  - Implement props interface for title, terms, and play mode
  - Add CSS styling for card layout, borders, and square sizing
  - Implement click handling for interactive squares in play mode
  - Add visual feedback for clicked squares (red circle overlay)
  - _Requirements: 1.1, 1.2, 3.4, 3.5_

- [x] 4. Implement CardCreator form component
  - Create form component with title input and terms textarea
  - Add free space image URL input field
  - Implement real-time form validation with error display
  - Create controlled components with proper state management
  - Add form submission handler that validates and creates card data
  - _Requirements: 1.1, 1.2, 1.5, 5.1, 5.3, 6.1, 6.5_

- [x] 5. Create card preview and generation functionality
  - Implement live preview that updates as user types in form
  - Add generate button that creates randomized card arrangement
  - Connect CardCreator to BingoCard component for preview display
  - Implement error handling for insufficient terms
  - Add loading states during card generation
  - _Requirements: 1.4, 5.2, 5.3, 6.1_

- [x] 6. Build multiple variant generation system
  - Create CardVariants component that displays multiple cards
  - Implement variant count selector (1-10 cards)
  - Add logic to generate multiple unique arrangements from same terms
  - Create grid layout for displaying multiple card variants
  - Implement validation to prevent variant generation with insufficient terms
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Implement URL-based sharing mechanism
  - Create urlEncoder utility for encoding/decoding card data
  - Implement base64 encoding with compression for large term lists
  - Add ShareModal component with shareable URL generation
  - Create route handling for shared URLs (/#/play?data=...)
  - Implement URL parameter parsing and card reconstruction
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Add PDF export functionality
  - Install and configure jsPDF and html2canvas libraries
  - Create pdfExporter utility that converts cards to PDF
  - Implement ExportControls component with export options
  - Add support for multi-page PDFs with multiple variants
  - Optimize PDF layout for standard paper sizes and print quality
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Implement routing and navigation
  - Set up React Router with routes for create and play modes
  - Create App component with navigation between modes
  - Implement proper route handling for shared card URLs
  - Add navigation controls and breadcrumbs
  - Handle browser back/forward navigation properly
  - _Requirements: 3.2, 5.4_

- [x] 10. Add comprehensive error handling
  - Implement error boundaries for React component errors
  - Add try-catch blocks around PDF generation and URL parsing
  - Create user-friendly error messages for all failure scenarios
  - Implement retry mechanisms for failed operations
  - Add loading states and progress indicators
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Implement responsive design and mobile support
  - Add CSS media queries for mobile and tablet layouts
  - Optimize card display for smaller screens
  - Ensure form inputs work well on touch devices
  - Test and adjust PDF export for mobile browsers
  - Implement touch-friendly interactions for card squares
  - _Requirements: 5.5_

- [ ] 12. Add local storage and data persistence
  - Implement auto-save functionality for form data
  - Store user preferences and recent cards in localStorage
  - Add recovery mechanism for unsaved work
  - Create utility functions for localStorage management
  - Handle storage quota exceeded errors gracefully
  - _Requirements: 6.1, 7.3_

- [ ] 13. Create comprehensive test suite
  - Write unit tests for all utility functions and hooks
  - Add component tests using React Testing Library
  - Implement integration tests for complete user workflows
  - Add tests for PDF generation and URL sharing functionality
  - Create performance tests for large term lists and multiple variants
  - _Requirements: 6.4_

- [ ] 14. Optimize performance and add final polish
  - Implement React.memo for expensive components
  - Add debouncing for real-time preview updates
  - Optimize bundle size and implement code splitting
  - Add accessibility attributes and keyboard navigation
  - Perform cross-browser testing and compatibility fixes
  - _Requirements: 5.5, 7.1_

- [ ] 15. Prepare for future extensibility
  - Set up Context API structure for future state management
  - Create placeholder components for user authentication UI
  - Design API abstraction layer for future backend integration
  - Document extension points and architectural decisions
  - Implement feature flags for future functionality
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_