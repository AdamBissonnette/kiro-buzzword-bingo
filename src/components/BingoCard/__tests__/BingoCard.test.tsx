import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BingoCard from '../BingoCard';

describe('BingoCard', () => {
  const mockTerms = [
    'Synergy', 'Paradigm', 'Leverage', 'Scalable', 'Disruptive',
    'Innovation', 'Agile', 'Blockchain', 'AI', 'Cloud',
    'Digital', 'Transform', 'Optimize', 'Strategic', 'Dynamic',
    'Ecosystem', 'Framework', 'Solution', 'Platform', 'Analytics',
    'Automation', 'Integration', 'Workflow', 'Efficiency'
  ];

  it('renders the card title', () => {
    render(
      <BingoCard 
        title="Test Bingo Card" 
        terms={mockTerms} 
      />
    );
    
    expect(screen.getByText('Test Bingo Card')).toBeInTheDocument();
  });

  it('displays FREE in the center square when no free space image is provided', () => {
    render(
      <BingoCard 
        title="Test Card" 
        terms={mockTerms} 
      />
    );
    
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('displays free space image when provided', () => {
    render(
      <BingoCard 
        title="Test Card" 
        terms={mockTerms}
        freeSpaceImage="https://example.com/image.jpg"
      />
    );
    
    const freeSpaceImage = screen.getByAltText('Free Space');
    expect(freeSpaceImage).toBeInTheDocument();
    expect(freeSpaceImage).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders terms from the provided array', () => {
    render(
      <BingoCard 
        title="Test Card" 
        terms={mockTerms} 
      />
    );
    
    // Check that some of the terms are rendered
    expect(screen.getByText('Synergy')).toBeInTheDocument();
    expect(screen.getByText('Paradigm')).toBeInTheDocument();
    expect(screen.getByText('Leverage')).toBeInTheDocument();
  });

  it('handles square clicks in play mode', () => {
    const onSquareClick = vi.fn();
    
    const { container } = render(
      <BingoCard 
        title="Test Card" 
        terms={mockTerms}
        isPlayMode={true}
        onSquareClick={onSquareClick}
      />
    );
    
    // Find the first square and click it
    const squares = container.querySelectorAll('[class*="square"]');
    fireEvent.click(squares[0]);
    expect(onSquareClick).toHaveBeenCalledWith(0);
  });

  it('does not handle clicks when not in play mode', () => {
    const onSquareClick = vi.fn();
    
    const { container } = render(
      <BingoCard 
        title="Test Card" 
        terms={mockTerms}
        isPlayMode={false}
        onSquareClick={onSquareClick}
      />
    );
    
    const squares = container.querySelectorAll('[class*="square"]');
    fireEvent.click(squares[0]);
    expect(onSquareClick).not.toHaveBeenCalled();
  });
});