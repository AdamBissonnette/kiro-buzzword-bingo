import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportProgressModal from '../ExportProgressModal';
import type { PDFExportProgress } from '../../../utils/pdfExporter';

describe('ExportProgressModal', () => {
  const mockProgress: PDFExportProgress = {
    current: 1,
    total: 3,
    stage: 'rendering',
    message: 'Rendering card 1 of 3...'
  };

  it('renders nothing when not visible', () => {
    const { container } = render(
      <ExportProgressModal
        isVisible={false}
        progress={mockProgress}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when progress is null', () => {
    const { container } = render(
      <ExportProgressModal
        isVisible={true}
        progress={null}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders progress modal when visible with progress', () => {
    render(
      <ExportProgressModal
        isVisible={true}
        progress={mockProgress}
      />
    );
    
    expect(screen.getByText(/Exporting PDF/)).toBeInTheDocument();
    expect(screen.getByText('Rendering card 1 of 3...')).toBeInTheDocument();
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
    expect(screen.getAllByText('33%')).toHaveLength(2); // Modal and LoadingSpinner
  });

  it('displays correct stage icons and descriptions', () => {
    const stages: Array<{ stage: PDFExportProgress['stage'], icon: string, description: string }> = [
      { stage: 'validation', icon: '🔍', description: 'Validating card elements...' },
      { stage: 'rendering', icon: '🎨', description: 'Converting cards to images...' },
      { stage: 'generating', icon: '📄', description: 'Creating PDF document...' },
      { stage: 'complete', icon: '✅', description: 'Export completed successfully!' }
    ];

    stages.forEach(({ stage, icon, description }) => {
      const progress = { ...mockProgress, stage, message: undefined };
      const { rerender } = render(
        <ExportProgressModal
          isVisible={true}
          progress={progress}
        />
      );
      
      // For complete stage, there are multiple checkmarks, so use getAllByText
      if (stage === 'complete') {
        expect(screen.getAllByText(new RegExp(icon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toHaveLength(2);
      } else {
        expect(screen.getByText(new RegExp(icon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
      }
      expect(screen.getByText(description)).toBeInTheDocument();
      
      rerender(<div />); // Clear for next iteration
    });
  });

  it('shows custom message when provided', () => {
    const customMessage = 'Custom progress message';
    const progressWithMessage = { ...mockProgress, message: customMessage };
    
    render(
      <ExportProgressModal
        isVisible={true}
        progress={progressWithMessage}
      />
    );
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('shows cancel button when cancellation is allowed', () => {
    const onCancel = vi.fn();
    
    render(
      <ExportProgressModal
        isVisible={true}
        progress={mockProgress}
        onCancel={onCancel}
        canCancel={true}
      />
    );
    
    const headerCancelButton = screen.getByLabelText('Cancel export');
    const actionCancelButton = screen.getByText('Cancel Export');
    
    expect(headerCancelButton).toBeInTheDocument();
    expect(actionCancelButton).toBeInTheDocument();
    
    fireEvent.click(headerCancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('hides cancel button when cancellation is not allowed', () => {
    render(
      <ExportProgressModal
        isVisible={true}
        progress={mockProgress}
        canCancel={false}
      />
    );
    
    expect(screen.queryByLabelText(/cancel/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel Export')).not.toBeInTheDocument();
  });

  it('shows success message when stage is complete', () => {
    const completeProgress = { ...mockProgress, stage: 'complete' as const };
    
    render(
      <ExportProgressModal
        isVisible={true}
        progress={completeProgress}
      />
    );
    
    expect(screen.getByText('Your PDF has been generated and downloaded successfully!')).toBeInTheDocument();
    expect(screen.queryByText('Cancel Export')).not.toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    const testCases = [
      { current: 0, total: 5, expected: '0%' },
      { current: 1, total: 4, expected: '25%' },
      { current: 2, total: 3, expected: '67%' },
      { current: 3, total: 3, expected: '100%' }
    ];

    testCases.forEach(({ current, total, expected }) => {
      const progress = { ...mockProgress, current, total };
      const { rerender } = render(
        <ExportProgressModal
          isVisible={true}
          progress={progress}
        />
      );
      
      // There are two progress bars (modal and LoadingSpinner), so expect 2 instances
      expect(screen.getAllByText(expected)).toHaveLength(2);
      
      rerender(<div />); // Clear for next iteration
    });
  });

  it('handles single card export (total = 1)', () => {
    const singleCardProgress = { ...mockProgress, current: 1, total: 1 };
    
    render(
      <ExportProgressModal
        isVisible={true}
        progress={singleCardProgress}
      />
    );
    
    expect(screen.queryByText(/Card \d+ of \d+/)).not.toBeInTheDocument();
    expect(screen.getAllByText('100%')).toHaveLength(2); // Modal and LoadingSpinner
  });

  it('calls onCancel when action button is clicked', () => {
    const onCancel = vi.fn();
    
    render(
      <ExportProgressModal
        isVisible={true}
        progress={mockProgress}
        onCancel={onCancel}
        canCancel={true}
      />
    );
    
    const cancelButton = screen.getByText('Cancel Export');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('applies correct CSS classes for styling', () => {
    render(
      <ExportProgressModal
        isVisible={true}
        progress={mockProgress}
      />
    );
    
    const overlay = screen.getByText(/Exporting PDF/).closest('[class*="overlay"]');
    expect(overlay).toBeInTheDocument();
    
    const modal = screen.getByText(/Exporting PDF/).closest('[class*="modal"]');
    expect(modal).toBeInTheDocument();
  });
});