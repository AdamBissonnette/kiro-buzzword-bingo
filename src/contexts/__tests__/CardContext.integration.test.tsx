import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CardProvider from '../CardContext';
import { useCardContext } from '../hooks';


// Integration test component that uses real CardContext
function CardIntegrationTest() {
  const {
    cardData,
    validationErrors,
    createCard,
    updateCardData,
    generateVariants,
    variants,
    clearCard
  } = useCardContext();

  const handleCreateCard = () => {
    const sampleTerms = Array.from({ length: 25 }, (_, i) => `Term ${i + 1}`);
    createCard({
      title: 'Test Card',
      terms: sampleTerms
    });
  };

  const handleUpdateTitle = () => {
    if (cardData) {
      updateCardData({ title: 'Updated Title' });
    }
  };

  const handleGenerateVariants = () => {
    generateVariants(3);
  };

  return (
    <div>
      <div data-testid="card-title">{cardData?.title || 'No card'}</div>
      <div data-testid="card-id">{cardData?.id || 'No ID'}</div>
      <div data-testid="terms-count">{cardData?.terms?.length || 0}</div>
      <div data-testid="variants-count">{variants.length}</div>
      <div data-testid="validation-errors">
        {JSON.stringify(validationErrors)}
      </div>
      
      <button data-testid="create-card" onClick={handleCreateCard}>
        Create Card
      </button>
      <button data-testid="update-title" onClick={handleUpdateTitle}>
        Update Title
      </button>
      <button data-testid="generate-variants" onClick={handleGenerateVariants}>
        Generate Variants
      </button>
      <button data-testid="clear-card" onClick={clearCard}>
        Clear Card
      </button>
    </div>
  );
}

describe('CardContext Integration Tests', () => {
  it('should handle complete card creation workflow', async () => {
    render(
      <CardProvider>
        <CardIntegrationTest />
      </CardProvider>
    );

    // Initial state
    expect(screen.getByTestId('card-title')).toHaveTextContent('No card');
    expect(screen.getByTestId('terms-count')).toHaveTextContent('0');
    expect(screen.getByTestId('variants-count')).toHaveTextContent('0');

    // Create a card
    fireEvent.click(screen.getByTestId('create-card'));

    await waitFor(() => {
      expect(screen.getByTestId('card-title')).toHaveTextContent('Test Card');
    });

    expect(screen.getByTestId('terms-count')).toHaveTextContent('25');
    expect(screen.getByTestId('card-id')).not.toHaveTextContent('No ID');

    // Update the card title
    fireEvent.click(screen.getByTestId('update-title'));

    await waitFor(() => {
      expect(screen.getByTestId('card-title')).toHaveTextContent('Updated Title');
    });

    // Generate variants
    fireEvent.click(screen.getByTestId('generate-variants'));

    await waitFor(() => {
      expect(screen.getByTestId('variants-count')).toHaveTextContent('3');
    });

    // Clear the card
    fireEvent.click(screen.getByTestId('clear-card'));

    await waitFor(() => {
      expect(screen.getByTestId('card-title')).toHaveTextContent('No card');
    });

    expect(screen.getByTestId('variants-count')).toHaveTextContent('0');
  });

  it('should handle validation errors correctly', async () => {
    render(
      <CardProvider>
        <ValidationTestComponent />
      </CardProvider>
    );

    // Initial state should have no errors
    expect(screen.getByTestId('validation-errors')).toHaveTextContent('No errors');

    // Try to create invalid card
    fireEvent.click(screen.getByTestId('create-invalid'));

    await waitFor(() => {
      expect(screen.getByTestId('validation-errors')).toHaveTextContent('Has errors');
    });

    expect(screen.getByTestId('error-details')).toHaveTextContent('Need at least 24 terms');
  });
});

// Test component for validation errors
function ValidationTestComponent() {
  const { createCard, validationErrors } = useCardContext();

  const handleCreateInvalidCard = () => {
    createCard({
      title: 'Test',
      terms: ['term1', 'term2'] // Not enough terms
    });
  };

  return (
    <div>
      <div data-testid="validation-errors">
        {Object.keys(validationErrors).length > 0 ? 'Has errors' : 'No errors'}
      </div>
      <div data-testid="error-details">
        {validationErrors.terms || 'No term errors'}
      </div>
      <button data-testid="create-invalid" onClick={handleCreateInvalidCard}>
        Create Invalid Card
      </button>
    </div>
  );
}

describe('CardContext Validation Integration', () => {
  it('should demonstrate context sharing between components', async () => {
    // Simple test to show that context works across components
    function SimpleSharedTest() {
      const { cardData, createCard } = useCardContext();
      
      const handleCreate = () => {
        const sampleTerms = Array.from({ length: 25 }, (_, i) => `Shared Term ${i + 1}`);
        createCard({
          title: 'Shared Card',
          terms: sampleTerms
        });
      };

      return (
        <div>
          <div data-testid="shared-title">{cardData?.title || 'No shared card'}</div>
          <button data-testid="create-shared" onClick={handleCreate}>
            Create Shared Card
          </button>
        </div>
      );
    }

    render(
      <CardProvider>
        <SimpleSharedTest />
      </CardProvider>
    );

    // Initial state
    expect(screen.getByTestId('shared-title')).toHaveTextContent('No shared card');

    // Create card
    fireEvent.click(screen.getByTestId('create-shared'));

    await waitFor(() => {
      expect(screen.getByTestId('shared-title')).toHaveTextContent('Shared Card');
    });
  });
});