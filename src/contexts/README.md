# Card Context

The CardContext provides centralized state management for card data throughout the application. It wraps the `useCardState` hook and makes it available to all child components through React Context.

## Usage

### 1. Wrap your app with CardProvider

```tsx
import { CardProvider } from './contexts/CardContext';
import App from './App';

function Root() {
  return (
    <CardProvider>
      <App />
    </CardProvider>
  );
}
```

### 2. Use the useCardContext hook in components

```tsx
import { useCardContext } from './contexts/CardContext';

function MyComponent() {
  const {
    cardData,
    validationErrors,
    createCard,
    updateCardData,
    generateVariants,
    variants
  } = useCardContext();

  const handleCreateCard = () => {
    const sampleTerms = Array.from({ length: 25 }, (_, i) => `Term ${i + 1}`);
    createCard({
      title: 'My Bingo Card',
      terms: sampleTerms
    });
  };

  const handleUpdateTitle = (newTitle: string) => {
    updateCardData({ title: newTitle });
  };

  return (
    <div>
      <h1>{cardData?.title || 'No card created'}</h1>
      
      {Object.keys(validationErrors).length > 0 && (
        <div className="errors">
          {validationErrors.title && <p>Title error: {validationErrors.title}</p>}
          {validationErrors.terms && <p>Terms error: {validationErrors.terms}</p>}
        </div>
      )}
      
      <button onClick={handleCreateCard}>Create Card</button>
      <button onClick={() => handleUpdateTitle('Updated Title')}>
        Update Title
      </button>
      
      {cardData && (
        <div>
          <p>Terms: {cardData.terms.length}</p>
          <p>Variants: {variants.length}</p>
        </div>
      )}
    </div>
  );
}
```

## Available Context Values

The `useCardContext` hook provides access to all the same values and functions as the `useCardState` hook:

- `cardData`: Current card data or null
- `variants`: Array of generated card variants
- `isEditing`: Boolean indicating if in editing mode
- `validationErrors`: Object containing validation error messages
- `updateCardData(updates)`: Update existing card data
- `createCard(data)`: Create a new card
- `generateVariants(count)`: Generate multiple card variants
- `randomizeCard()`: Randomize current card arrangement
- `validateCard(data)`: Validate card data and return errors
- `clearCard()`: Clear current card and reset state
- `setEditingMode(editing)`: Set editing mode

## Error Handling

The context includes proper error handling:

```tsx
function MyComponent() {
  try {
    const cardContext = useCardContext();
    // Use context normally
  } catch (error) {
    // This will throw if component is not wrapped with CardProvider
    console.error('Component must be wrapped with CardProvider');
  }
}
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.1**: Centralized state management with automatic updates to dependent components
- **Requirement 2.2**: State preservation when switching between views and maintaining multiple card variants

The CardContext provides a clean, type-safe way to share card state across the entire application while maintaining the existing functionality of the `useCardState` hook.