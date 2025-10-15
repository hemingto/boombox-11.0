import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InfoCard } from '@/components/ui/primitives/InfoCard';
import { HeartIcon } from '@heroicons/react/24/outline';

describe('InfoCard', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
    buttonText: 'Click Me',
    buttonIcon: <HeartIcon data-testid="icon" />,
    onButtonClick: jest.fn(),
    onClose: jest.fn(),
  };

  it('renders the card with default props', () => {
    render(<InfoCard {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('shows the close icon and handles close clicks', () => {
    render(<InfoCard {...defaultProps} showCloseIcon />);

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('handles button clicks', () => {
    render(<InfoCard {...defaultProps} />);

    const mainButton = screen.getByText('Click Me');
    fireEvent.click(mainButton);

    expect(defaultProps.onButtonClick).toHaveBeenCalledTimes(1);
  });

  it('applies the correct variant classes', () => {
    const { container } = render(<InfoCard {...defaultProps} variant="success" />);
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const div = container.firstChild;

    expect(div).toHaveClass('bg-status-bg-success');
    expect(div).toHaveClass('border-status-success');
  });

  it('has correct accessibility attributes', () => {
    render(<InfoCard {...defaultProps} />);

    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-labelledby', 'info-card-title');

    const title = screen.getByText('Test Title');
    expect(title).toHaveAttribute('id', 'info-card-title');
  });
});
