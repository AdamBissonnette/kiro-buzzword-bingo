import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportControls } from '../ExportControls';
import type { CardData } from '../../../types';
import { PDFExporter } from '../../../utils/pdfExporter';

// Mock PDFExporter
vi.mock('../../../utils/pdfExporter', () => ({
  PDFExporter: {
    exportCard: vi.fn(),
    exportMultipleCards: vi.fn(),
    exportCardsFromContainer: vi.fn(),
    generateFilename: vi.fn().mockReturnValue('test-card.pdf'),
    isSupported: vi.fn().mockReturnValue(true),
    createExportController: vi.fn().mockReturnValue({
      cancel: vi.fn(),
      isCancelled: vi.fn().mockReturnValue(false)
    })
  },
  ExportCancellationError: class ExportCancellationError extends Error {
    constructor(message = 'Export was cancelled by user') {
      super(message);
      this.name = 'ExportCancellationError';
    }
  }
}));

// Mock the new modal components
interface MockProgressModalProps {
  isVisible: boolean;
  progress?: { current: number; total: number; stage: string };
  onCancel?: () => void;
}

interface MockErrorModalProps {
  isVisible: boolean;
  error?: { message: string };
  onRetry?: () => void;
  onDismiss: () => void;
}

vi.mock('../ExportProgressModal', () => ({
  default: ({ isVisible, progress, onCancel }: MockProgressModalProps) => 
    isVisible && progress ? (
      <div data-testid="export-progress-modal">
        <div>Progress: {progress?.current}/{progress?.total}</div>
        <div>Stage: {progress?.stage}</div>
        {onCancel && <button onClick={onCancel}>Cancel</button>}
      </div>
    ) : null
}));

vi.mock('../ExportErrorModal', () => ({
  default: ({ isVisible, error, onRetry, onDismiss }: MockErrorModalProps) => 
    isVisible && error ? (
      <div data-testid="export-error-modal">
        <div>Error: {error?.message}</div>
        {onRetry && <button onClick={onRetry}>Retry</button>}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    ) : null
}));

describe('ExportControls', () => {
  const mockCards: CardData[] = [
    {
      title: 'Test Card 1',
      terms: ['term1', 'term2', 'term3'],
      freeSpaceImage: 'test.jpg'
    }
  ];

  const mockCardElements = [document.createElement('div')];
  const mockCallbacks = {
    onExportStart: vi.fn(),
    onExportComplete: vi.fn(),
    onExportError: vi.fn()
  };

  const defaultProps = {
    cards: mockCards,
    cardElements: mockCardElements,
    variantCount: 1,
    ...mockCallbacks
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render export controls with default options', () => {
    render(<ExportControls {...defaultProps} />);

    expect(screen.getByText('Export to PDF')).toBeInTheDocument();
    expect(screen.getByText('Paper Size:')).toBeInTheDocument();
    expect(screen.getByText('Orientation:')).toBeInTheDocument();
    expect(screen.getByText(/Quality:/)).toBeInTheDocument();
    expect(screen.getByText('1 card will be exported')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument();
  });

  it('should show multiple cards count', () => {
    const multipleCards = [...mockCards, { ...mockCards[0], title: 'Card 2' }];
    const multipleElements = [...mockCardElements, document.createElement('div')];

    render(
      <ExportControls
        {...defaultProps}
        cards={multipleCards}
        cardElements={multipleElements}
        variantCount={2}
      />
    );

    expect(screen.getByText('2 cards will be exported (2 pages)')).toBeInTheDocument();
  });

  it('should handle format selection', () => {
    render(<ExportControls {...defaultProps} />);

    const letterRadio = screen.getByLabelText('Letter');
    fireEvent.click(letterRadio);

    expect(letterRadio).toBeChecked();
  });

  it('should handle orientation selection', () => {
    render(<ExportControls {...defaultProps} />);

    const landscapeRadio = screen.getByLabelText('Landscape');
    fireEvent.click(landscapeRadio);

    expect(landscapeRadio).toBeChecked();
  });

  it('should handle quality slider changes', () => {
    render(<ExportControls {...defaultProps} />);

    const qualitySlider = screen.getByRole('slider');
    fireEvent.change(qualitySlider, { target: { value: '1.5' } });

    expect(screen.getByText('Quality: 150%')).toBeInTheDocument();
  });

  it('should export single card successfully', async () => {
    const mockExportCard = vi.mocked(PDFExporter.exportCard);
    mockExportCard.mockResolvedValueOnce();

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    expect(mockCallbacks.onExportStart).toHaveBeenCalled();
    expect(screen.getByText('Generating PDF...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockExportCard).toHaveBeenCalledWith(
        mockCardElements[0],
        'test-card.pdf',
        expect.objectContaining({
          format: 'a4',
          orientation: 'portrait',
          quality: 1.0
        }),
        expect.any(Function),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockCallbacks.onExportComplete).toHaveBeenCalled();
    });
  });

  it('should export multiple cards successfully', async () => {
    const mockExportMultiple = vi.mocked(PDFExporter.exportMultipleCards);
    mockExportMultiple.mockResolvedValueOnce();

    const multipleCards = [...mockCards, { ...mockCards[0], title: 'Card 2' }];
    const multipleElements = [...mockCardElements, document.createElement('div')];

    render(
      <ExportControls
        {...defaultProps}
        cards={multipleCards}
        cardElements={multipleElements}
        variantCount={2}
      />
    );

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockExportMultiple).toHaveBeenCalledWith(
        multipleElements,
        'test-card.pdf',
        expect.objectContaining({
          format: 'a4',
          orientation: 'portrait',
          quality: 1.0
        }),
        expect.any(Function),
        expect.any(Object)
      );
    });
  });

  it('should handle export errors', async () => {
    const mockExportCard = vi.mocked(PDFExporter.exportCard);
    mockExportCard.mockRejectedValueOnce(new Error('Export failed'));

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockCallbacks.onExportError).toHaveBeenCalledWith('Export failed');
    });
  });

  it('should disable export when no cards available', () => {
    render(
      <ExportControls
        {...defaultProps}
        cards={[]}
        cardElements={[]}
      />
    );

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    expect(exportButton).toBeDisabled();
  });

  it('should show warning when PDF export is not supported', () => {
    const mockIsSupported = vi.mocked(PDFExporter.isSupported);
    mockIsSupported.mockReturnValueOnce(false);

    render(<ExportControls {...defaultProps} />);

    expect(screen.getByText(/PDF export is not supported in this browser/)).toBeInTheDocument();
  });

  it('should handle export with no cards error', async () => {
    render(
      <ExportControls
        {...defaultProps}
        cards={[]}
        cardElements={[]}
      />
    );

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    expect(exportButton).toBeDisabled();
    
    // The button should be disabled, so no error callback should be called
    // This test verifies the UI prevents invalid actions
    expect(mockCallbacks.onExportError).not.toHaveBeenCalled();
  });

  it('should handle unsupported browser error', async () => {
    const mockIsSupported = vi.mocked(PDFExporter.isSupported);
    mockIsSupported.mockReturnValue(false);

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockCallbacks.onExportError).toHaveBeenCalledWith('PDF export is not supported in this browser');
    });
  });

  it('should show progress modal during export', async () => {
    const mockExportCard = vi.mocked(PDFExporter.exportCard);
    
    mockExportCard.mockImplementation(async (element, filename, options, onProgress) => {
      // Simulate progress callback
      if (onProgress) {
        onProgress({ current: 1, total: 1, stage: 'rendering', message: 'Rendering...' });
      }
      // Add a small delay to simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return Promise.resolve();
    });

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByTestId('export-progress-modal')).toBeInTheDocument();
    });
  });

  it('should show error modal on export failure', async () => {
    const mockExportCard = vi.mocked(PDFExporter.exportCard);
    mockExportCard.mockRejectedValueOnce(new Error('Export failed'));

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByTestId('export-error-modal')).toBeInTheDocument();
      expect(screen.getByText('Error: Export failed')).toBeInTheDocument();
    });
  });

  it('should handle export cancellation', async () => {
    const mockController = {
      cancel: vi.fn(),
      isCancelled: vi.fn().mockReturnValue(false)
    };
    const mockCreateController = vi.mocked(PDFExporter.createExportController);
    mockCreateController.mockReturnValue(mockController);

    const mockExportCard = vi.mocked(PDFExporter.exportCard);
    mockExportCard.mockImplementation(async (element, filename, options, onProgress) => {
      if (onProgress) {
        onProgress({ current: 1, total: 1, stage: 'rendering', message: 'Rendering...' });
      }
      // Simulate a long-running operation
      return new Promise((resolve) => setTimeout(resolve, 1000));
    });

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByTestId('export-progress-modal')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockController.cancel).toHaveBeenCalled();
  });

  it('should show success message after successful export', async () => {
    const mockExportCard = vi.mocked(PDFExporter.exportCard);
    mockExportCard.mockResolvedValueOnce();

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    // Wait for the success message to appear
    await waitFor(() => {
      expect(screen.getByText('PDF exported successfully!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle retry from error modal', async () => {
    const mockExportCard = vi.mocked(PDFExporter.exportCard);
    mockExportCard.mockRejectedValueOnce(new Error('Export failed'));
    mockExportCard.mockResolvedValueOnce(undefined);

    render(<ExportControls {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByTestId('export-error-modal')).toBeInTheDocument();
    }, { timeout: 3000 });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockExportCard).toHaveBeenCalledTimes(2);
    });
  });

  it('should use container for automatic card detection when provided', async () => {
    const mockExportFromContainer = vi.mocked(PDFExporter.exportCardsFromContainer);
    mockExportFromContainer.mockResolvedValueOnce();

    const container = document.createElement('div');

    render(
      <ExportControls
        {...defaultProps}
        container={container}
        cardElements={undefined}
      />
    );

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockExportFromContainer).toHaveBeenCalledWith(
        container,
        mockCards,
        'test-card.pdf',
        expect.objectContaining({
          format: 'a4',
          orientation: 'portrait',
          quality: 1.0
        }),
        expect.any(Function),
        expect.any(Object)
      );
    });
  });
});