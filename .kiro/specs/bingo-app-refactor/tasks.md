# Implementation Plan

## Phase 1: State Management Foundation

- [x] 1. Create centralized card state management hook
  - Implement `useCardState` custom hook with card data management
  - Add validation logic for card title and terms
  - Include methods for updating, creating, and managing card data
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Create card context provider
  - Implement React context for sharing card state across components
  - Add context provider wrapper with proper TypeScript types
  - Create context consumer hook for easy access to card state
  - _Requirements: 2.1, 2.2_

- [x] 3. Update CardData interface and types
  - Enhance CardData interface with id, timestamps, and validation fields
  - Create ValidationErrors interface for form validation
  - Add AppState interface for centralized application state
  - Update existing type definitions to match new structure
  - _Requirements: 2.1, 5.4_

## Phase 2: ControlsSidebar Integration

- [x] 4. Extract card creation form from CardCreator
  - Create CardCreationForm component with title, terms, and icon selection
  - Implement real-time validation with debounced updates
  - Add proper form state management and error handling
  - Ensure accessibility with proper ARIA labels and keyboard navigation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 5. Integrate CardCreationForm into ControlsSidebar
  - Refactor ControlsSidebar to include card creation functionality
  - Implement tabbed or sectioned interface for creation vs management
  - Add proper state synchronization between form and preview
  - Ensure responsive design for mobile devices
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.5_

- [x] 6. Update ControlsSidebar component interface
  - Modify ControlsSidebarProps to include card creation callbacks
  - Add proper TypeScript types for all new functionality
  - Implement proper prop validation and default values
  - Update component documentation and examples
  - _Requirements: 2.1, 5.4_

## Phase 3: App Component Refactor

- [x] 7. Refactor App component for unified interface
  - Remove CardCreator route and component usage
  - Implement single-page layout with sidebar and main content
  - Add proper state management using new card state hook
  - Ensure proper error boundary handling for new architecture
  - _Requirements: 1.1, 6.1, 6.2_

- [x] 8. Create MainContent component for card display
  - Implement component to handle both single and multiple card views
  - Add proper layout switching based on variant count
  - Implement responsive design with proper spacing and alignment
  - Add loading states and error handling for card rendering
  - _Requirements: 3.1, 3.3, 6.1, 6.5_

- [x] 9. Update routing and navigation
  - Simplify routing to single main route with state-based views
  - Update navigation components to work with new architecture
  - Ensure proper URL state management for sharing and bookmarking
  - Test browser back/forward navigation functionality
  - _Requirements: 6.1, 6.2_

## Phase 4: Multiple Card Layout Implementation

- [x] 10. Implement horizontal card row layout
  - Create responsive horizontal scrollable container for multiple cards
  - Add proper spacing, alignment, and card sizing
  - Implement smooth scrolling and touch/swipe support for mobile
  - Add variant numbering and clear visual hierarchy
  - _Requirements: 3.1, 3.2, 3.4, 6.5_

- [x] 11. Update CardVariants component for new layout
  - Refactor CardVariants to use horizontal row instead of grid
  - Remove duplicate controls (now handled in ControlsSidebar)
  - Optimize rendering performance for multiple cards
  - Add proper accessibility support for card navigation
  - _Requirements: 3.1, 3.2, 3.4, 5.3_

- [x] 12. Implement variant generation optimization
  - Add lazy loading for variant generation to improve performance
  - Implement proper memoization to prevent unnecessary re-renders
  - Add progress indicators for variant generation process
  - Optimize memory usage for large numbers of variants
  - _Requirements: 3.4, 2.2_

## Phase 5: PDF Export System Overhaul

- [x] 13. Refactor PDF export utilities
  - Improve PDFExporter class with better error handling
  - Add proper canvas element validation and cleanup
  - Implement retry mechanisms for failed exports
  - Add detailed logging and debugging capabilities
  - _Requirements: 4.1, 4.4, 5.4_

- [x] 14. Fix card element detection for export
  - Implement reliable method to find and validate card elements
  - Add proper handling for both single and multiple card scenarios
  - Ensure card elements are properly rendered before export
  - Add validation for card content and dimensions
  - _Requirements: 4.1, 4.2, 4.3, 2.4_

- [x] 15. Implement export progress and feedback
  - Add progress indicators for multi-card PDF generation
  - Implement proper user feedback for export success/failure
  - Add cancellation support for long-running exports
  - Create comprehensive error messages with troubleshooting tips
  - _Requirements: 4.4, 4.5, 6.3, 6.4_

## Phase 6: Code Cleanup and Optimization

- [x] 16. Remove unused components and files
  - Identify and remove CardCreator component and related files
  - Clean up unused utility functions and helper modules
  - Remove redundant or duplicate code across components
  - Update import statements to remove unused dependencies
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 17. Update and fix TypeScript issues
  - Resolve all TypeScript errors and warnings
  - Add proper type definitions for new components and hooks
  - Implement strict type checking for improved code quality
  - Update component prop types and interfaces
  - _Requirements: 5.4_

- [x] 18. Optimize component performance
  - Implement React.memo for components that don't need frequent re-renders
  - Add proper dependency arrays for useEffect and useCallback hooks
  - Optimize state updates to minimize unnecessary renders
  - Add performance monitoring and debugging tools
  - _Requirements: 6.2_

## Phase 7: Testing and Quality Assurance

- [ ] 19. Update existing tests for refactored components
  - Modify tests for ControlsSidebar to include new functionality
  - Update App component tests for new architecture
  - Fix broken tests due to component removal and refactoring
  - Add new test cases for edge cases and error scenarios
  - _Requirements: 5.5_

- [ ] 20. Create comprehensive integration tests
  - Test complete card creation workflow from form to preview
  - Test multiple card generation and display functionality
  - Test PDF export process with various card configurations
  - Test responsive design and mobile functionality
  - _Requirements: 5.5, 6.5_

- [ ] 21. Implement end-to-end testing
  - Create E2E tests for complete user workflows
  - Test error handling and recovery scenarios
  - Test performance with large numbers of cards and terms
  - Validate accessibility compliance and keyboard navigation
  - _Requirements: 5.5, 6.3, 6.4_

## Phase 8: Final Polish and Documentation

- [ ] 22. Implement responsive design improvements
  - Ensure proper mobile layout for new sidebar interface
  - Test and optimize touch interactions for mobile devices
  - Implement proper viewport handling and orientation changes
  - Add mobile-specific optimizations and gestures
  - _Requirements: 6.5_

- [ ] 23. Add accessibility enhancements
  - Implement proper ARIA labels and roles for new components
  - Add keyboard navigation support for all interactive elements
  - Test with screen readers and accessibility tools
  - Ensure proper color contrast and visual hierarchy
  - _Requirements: 6.3, 6.4_

- [ ] 24. Final testing and bug fixes
  - Perform comprehensive testing of all functionality
  - Fix any remaining bugs or edge cases
  - Optimize performance and memory usage
  - Validate cross-browser compatibility
  - _Requirements: 5.5, 6.2, 6.4_