import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner with default size', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('medium');
  });

  it('renders spinner with specified size', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveClass('large');
  });

  it('displays message when provided', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('does not display message when not provided', () => {
    const { container } = render(<LoadingSpinner />);
    
    expect(container.querySelector('.message')).not.toBeInTheDocument();
  });

  it('displays progress bar when progress is provided', () => {
    render(<LoadingSpinner progress={50} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    const progressFill = document.querySelector('.progressFill');
    expect(progressFill).toHaveStyle('width: 50%');
  });

  it('does not display progress bar when progress is not provided', () => {
    const { container } = render(<LoadingSpinner />);
    
    expect(container.querySelector('.progressContainer')).not.toBeInTheDocument();
  });

  it('clamps progress value between 0 and 100', () => {
    const { rerender } = render(<LoadingSpinner progress={150} />);
    
    let progressFill = document.querySelector('.progressFill');
    expect(progressFill).toHaveStyle('width: 100%');
    
    rerender(<LoadingSpinner progress={-10} />);
    
    progressFill = document.querySelector('.progressFill');
    expect(progressFill).toHaveStyle('width: 0%');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});