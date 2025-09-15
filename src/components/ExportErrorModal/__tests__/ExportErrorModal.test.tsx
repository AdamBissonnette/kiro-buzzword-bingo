import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportErrorModal from '../ExportErrorModal';
import type { AppError } from '../../../types';

describe('ExportErrorModal', () => {
  const mockError: AppError = {
    code: 'PDF_EXPORT_ERROR',
    message: 'Failed to export PDF',
    details: 'The card content could not be converted to PDF format.',
    retryable: true,
    timestamp: new Date()
  };

  const mockOnRetry = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { container } = render(
      <ExportErrorModal
        isVisible={false}
        error={mockError}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when error is null', () => {
    const { container } = render(
      <ExportErrorModal
        isVisible={true}
        error={null}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders error modal when visible with error', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(screen.getByText('Export Failed')).toBeInTheDocument();
    expect(screen.getByText(mockError.message)).toBeInTheDocument();
    expect(screen.getByText(mockError.details!)).toBeInTheDocument();
  });

  it('displays correct error icons for different error codes', () => {
    const errorCodes = [
      { code: 'PDF_EXPORT_ERROR', icon: '📄' },
      { code: 'BROWSER_COMPATIBILITY_ERROR', icon: '🌍' },
      { code: 'NETWORK_ERROR', icon: '🌐' },
      { code: 'UNKNOWN_ERROR', icon: '❌' }
    ];

    errorCodes.forEach(({ code, icon }) => {
      const error = { ...mockError, code };
      const { rerender } = render(
        <ExportErrorModal
          isVisible={true}
          error={error}
          onDismiss={mockOnDismiss}
        />
      );
      
      expect(screen.getByText(new RegExp(icon))).toBeInTheDocument();
      
      rerender(<div />); // Clear for next iteration
    });
  });

  it('shows retry button when error is retryable and onRetry is provided', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        canRetry={true}
      />
    );
    
    const retryButton = screen.getByText('🔄 Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button when error is not retryable', () => {
    const nonRetryableError = { ...mockError, retryable: false };
    
    render(
      <ExportErrorModal
        isVisible={true}
        error={nonRetryableError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        canRetry={true}
      />
    );
    
    expect(screen.queryByText('🔄 Try Again')).not.toBeInTheDocument();
  });

  it('hides retry button when canRetry is false', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        canRetry={false}
      />
    );
    
    expect(screen.queryByText('🔄 Try Again')).not.toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onDismiss={mockOnDismiss}
      />
    );
    
    const closeButton = screen.getByLabelText('Close error dialog');
    fireEvent.click(closeButton);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onDismiss={mockOnDismiss}
      />
    );
    
    const dismissButton = screen.getByText('Close');
    fireEvent.click(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('toggles troubleshooting section when clicked', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onDismiss={mockOnDismiss}
      />
    );
    
    const troubleshootingToggle = screen.getByText('💡 Troubleshooting Tips');
    
    // Initially collapsed
    expect(screen.queryByText('Try these solutions to resolve the export issue:')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(troubleshootingToggle);
    expect(screen.getByText('Try these solutions to resolve the export issue:')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(troubleshootingToggle);
    expect(screen.queryByText('Try these solutions to resolve the export issue:')).not.toBeInTheDocument();
  });

  it('shows appropriate troubleshooting tips for PDF export errors', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Expand troubleshooting section
    const troubleshootingToggle = screen.getByText('💡 Troubleshooting Tips');
    fireEvent.click(troubleshootingToggle);
    
    // Check for PDF-specific tips
    expect(screen.getByText('Check card visibility')).toBeInTheDocument();
    expect(screen.getByText('Reduce export quality')).toBeInTheDocument();
    expect(screen.getByText('Close other browser tabs')).toBeInTheDocument();
    expect(screen.getByText('Try a different browser')).toBeInTheDocument();
  });

  it('shows appropriate troubleshooting tips for browser compatibility errors', () => {
    const compatibilityError = { ...mockError, code: 'BROWSER_COMPATIBILITY_ERROR' };
    
    render(
      <ExportErrorModal
        isVisible={true}
        error={compatibilityError}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Expand troubleshooting section
    const troubleshootingToggle = screen.getByText('💡 Troubleshooting Tips');
    fireEvent.click(troubleshootingToggle);
    
    // Check for browser compatibility tips
    expect(screen.getByText('Update your browser')).toBeInTheDocument();
    expect(screen.getByText('Enable JavaScript')).toBeInTheDocument();
  });

  it('shows appropriate troubleshooting tips for network errors', () => {
    const networkError = { ...mockError, code: 'NETWORK_ERROR' };
    
    render(
      <ExportErrorModal
        isVisible={true}
        error={networkError}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Expand troubleshooting section
    const troubleshootingToggle = screen.getByText('💡 Troubleshooting Tips');
    fireEvent.click(troubleshootingToggle);
    
    // Check for network-specific tips
    expect(screen.getByText('Check internet connection')).toBeInTheDocument();
    expect(screen.getByText('Disable ad blockers')).toBeInTheDocument();
  });

  it('shows generic troubleshooting tips for unknown errors', () => {
    const unknownError = { ...mockError, code: 'UNKNOWN_ERROR' };
    
    render(
      <ExportErrorModal
        isVisible={true}
        error={unknownError}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Expand troubleshooting section
    const troubleshootingToggle = screen.getByText('💡 Troubleshooting Tips');
    fireEvent.click(troubleshootingToggle);
    
    // Check for generic tips
    expect(screen.getByText('Refresh the page')).toBeInTheDocument();
    expect(screen.getByText('Clear browser cache')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  it('handles error without details gracefully', () => {
    const errorWithoutDetails = { ...mockError, details: undefined };
    
    render(
      <ExportErrorModal
        isVisible={true}
        error={errorWithoutDetails}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(screen.getByText(mockError.message)).toBeInTheDocument();
    expect(screen.queryByText(mockError.details!)).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    render(
      <ExportErrorModal
        isVisible={true}
        error={mockError}
        onDismiss={mockOnDismiss}
      />
    );
    
    const overlay = screen.getByText('Export Failed').closest('[class*="overlay"]');
    expect(overlay).toBeInTheDocument();
    
    const modal = screen.getByText('Export Failed').closest('[class*="modal"]');
    expect(modal).toBeInTheDocument();
  });
});