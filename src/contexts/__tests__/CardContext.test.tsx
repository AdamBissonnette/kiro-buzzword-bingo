import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardProvider from '../CardContext';
import { useCardContext } from '../hooks';
import type { CardData } from '../../types';

// Mock the useCardState hook
vi.mock('../../hooks/useCardState', () => ({
  useCardState: vi.fn(() => ({
    cardData: null,
    variants: [],
    isEditing: false,
    validationErrors: {},
    updateCardData: vi.fn(),
    createCard: vi.fn(),
    generateVariants: vi.fn(),
    randomizeCard: vi.fn(),
    validateCard: vi.fn(),
    clearCard: vi.fn(),
    setEditingMode: vi.fn(),
  }))
}));

// Test component that uses the CardContext
function TestComponent() {
  const {
    cardData,
    isEditing,
    validationErrors,
    updateCardData,
    createCard,
    setEditingMode
  } = useCardContext();

  return (
    <div>
      <div data-testid="card-title">{cardData?.title || 'No card'}</div>
      <div data-testid="is-editing">{isEditing ? 'editing' : 'not editing'}</div>
      <div data-testid="validation-errors">
        {Object.keys(validationErrors).length > 0 ? 'has errors' : 'no errors'}
      </div>
      <button 
        data-testid="update-title" 
        onClick={() => updateCardData({ title: 'Updated Title' })}
      >
        Update Title
      </button>
      <button 
        data-testid="create-card" 
        onClick={() => createCard({ title: 'New Card', terms: [] })}
      >
        Create Card
      </button>
      <button 
        data-testid="set-editing" 
        onClick={() => setEditingMode(true)}
      >
        Set Editing
      </button>
    </div>
  );
}

describe('CardContext', () => {
  it('provides card state to child components', () => {
    render(
      <CardProvider>
        <TestComponent />
      </CardProvider>
    );

    // Check that the context values are accessible
    expect(screen.getByTestId('card-title')).toHaveTextContent('No card');
    expect(screen.getByTestId('is-editing')).toHaveTextContent('not editing');
    expect(screen.getByTestId('validation-errors')).toHaveTextContent('no errors');
  });

  it('provides all card management functions', () => {
    render(
      <CardProvider>
        <TestComponent />
      </CardProvider>
    );

    // Check that all buttons are rendered (meaning functions are available)
    expect(screen.getByTestId('update-title')).toBeInTheDocument();
    expect(screen.getByTestId('create-card')).toBeInTheDocument();
    expect(screen.getByTestId('set-editing')).toBeInTheDocument();
  });

  it('throws error when useCardContext is used outside provider', () => {
    // Mock console.error to avoid error output in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow(
      'useCardContext must be used within a CardProvider. ' +
      'Make sure to wrap your component tree with <CardProvider>.'
    );

    consoleSpy.mockRestore();
  });

  it('allows nested providers (though not recommended)', () => {
    render(
      <CardProvider>
        <CardProvider>
          <TestComponent />
        </CardProvider>
      </CardProvider>
    );

    // Should still work with nested providers
    expect(screen.getByTestId('card-title')).toHaveTextContent('No card');
  });
});

// Test component that demonstrates context usage with actual card data
function TestComponentWithCardData() {
  const { cardData, variants, validationErrors } = useCardContext();

  return (
    <div>
      <div data-testid="card-data">
        {cardData ? JSON.stringify(cardData) : 'null'}
      </div>
      <div data-testid="variants-count">{variants.length}</div>
      <div data-testid="errors-count">{Object.keys(validationErrors).length}</div>
    </div>
  );
}

describe('CardContext with mock data', () => {
  it('handles card data correctly', async () => {
    const mockCardData: CardData = {
      id: 'test-card-1',
      title: 'Test Card',
      terms: ['term1', 'term2'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUseCardState = {
      cardData: mockCardData,
      variants: [mockCardData],
      isEditing: true,
      validationErrors: { title: 'Title error' },
      updateCardData: vi.fn(),
      createCard: vi.fn(),
      generateVariants: vi.fn(),
      randomizeCard: vi.fn(),
      validateCard: vi.fn(),
      clearCard: vi.fn(),
      setEditingMode: vi.fn(),
    };

    // Re-mock with specific data
    const { useCardState } = await import('../../hooks/useCardState');
    vi.mocked(useCardState).mockReturnValue(mockUseCardState);

    render(
      <CardProvider>
        <TestComponentWithCardData />
      </CardProvider>
    );

    expect(screen.getByTestId('card-data')).toHaveTextContent('Test Card');
    expect(screen.getByTestId('variants-count')).toHaveTextContent('1');
    expect(screen.getByTestId('errors-count')).toHaveTextContent('1');
  });
});