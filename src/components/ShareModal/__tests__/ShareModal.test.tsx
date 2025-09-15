import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareModal from '../ShareModal';
import type { CardData } from '../../../types';

// Mock the urlEncoder module
vi.mock('../../../utils/urlEncoder', () => ({
  generateShareableUrl: vi.fn((cardData: CardData) => 
    `https://example.com/bingo#/play?data=mock-encoded-${cardData.title.replace(/\s+/g, '-')}`
  )
}));

describe('ShareModal', () => {
  const mockCardData: CardData = {
    title: 'Test Bingo Card',
    terms: [
      'synergy', 'paradigm', 'leverage', 'optimize', 'streamline',
      'innovative', 'disruptive', 'scalable', 'agile', 'robust',
      'seamless', 'cutting-edge', 'best-practice', 'game-changer', 'value-add',
      'low-hanging-fruit', 'circle-back', 'touch-base', 'deep-dive', 'pivot',
      'bandwidth', 'deliverable', 'actionable', 'holistic'
    ]
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
    
    // Mock secure context
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Share Bingo Card')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/https:\/\/example\.com\/bingo#\/play\?data=mock-encoded-Test-Bingo-Card/)).toBeInTheDocument();
  });

  it('should display the generated shareable URL', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const urlInput = screen.getByDisplayValue(/mock-encoded-Test-Bingo-Card/);
    expect(urlInput).toBeInTheDocument();
    expect(urlInput).toHaveAttribute('readonly');
  });

  it('should close modal when close button is clicked', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when overlay is clicked', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when Escape key is pressed', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const modal = screen.getByRole('dialog');
    fireEvent.keyDown(modal, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should copy URL to clipboard when copy button is clicked', async () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const copyButton = screen.getByText('Copy Link');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/bingo#/play?data=mock-encoded-Test-Bingo-Card'
      );
    });

    expect(screen.getByText('✓ Link copied to clipboard!')).toBeInTheDocument();
  });

  it('should select URL text when input is clicked', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const urlInput = screen.getByDisplayValue(/mock-encoded-Test-Bingo-Card/) as HTMLInputElement;
    const selectSpy = vi.spyOn(urlInput, 'select');
    
    fireEvent.click(urlInput);

    expect(selectSpy).toHaveBeenCalled();
  });

  it('should handle clipboard copy failure gracefully', async () => {
    // Mock clipboard failure
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed'))
      }
    });

    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const copyButton = screen.getByText('Copy Link');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to copy to clipboard')).toBeInTheDocument();
    });
  });

  it('should show share button when Web Share API is available', () => {
    // Mock Web Share API
    Object.assign(navigator, {
      share: vi.fn().mockResolvedValue(undefined)
    });

    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('should call Web Share API when share button is clicked', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      share: mockShare
    });

    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const shareButton = screen.getByText('Share');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Bingo Card: Test Bingo Card',
        text: 'Check out this bingo card: Test Bingo Card',
        url: 'https://example.com/bingo#/play?data=mock-encoded-Test-Bingo-Card'
      });
    });
  });

  it('should not close modal when clicking inside modal content', () => {
    render(
      <ShareModal
        cardData={mockCardData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const modalContent = screen.getByText('Share Bingo Card');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});