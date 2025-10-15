/**
 * @fileoverview Tests for PackingKits component
 * Following boombox-11.0 testing standards
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PackingKits } from '@/components/features/packing-supplies/PackingKits';

expect.extend(toHaveNoViolations);

// Mock Hero Icons
jest.mock('@heroicons/react/20/solid', () => ({
  ArrowLeftIcon: function MockArrowLeftIcon(props: any) {
    return <svg data-testid="arrow-left-icon" {...props} />;
  },
  ArrowRightIcon: function MockArrowRightIcon(props: any) {
    return <svg data-testid="arrow-right-icon" {...props} />;
  },
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  },
}));

// Mock Modal component
jest.mock('@/components/ui/primitives/Modal/Modal', () => ({
  Modal: function MockModal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
      <div data-testid="modal" role="dialog">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <div data-testid="modal-content">{children}</div>
      </div>
    );
  },
}));

describe('PackingKits', () => {
  const mockOnAddToCart = jest.fn();

  const defaultProps = {
    onAddToCart: mockOnAddToCart,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component with heading and badge', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByText('Packing Supplies')).toBeInTheDocument();
      expect(screen.getByText('Free delivery')).toBeInTheDocument();
    });

    it('should render all three packing kits', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByText('Apartment Kit')).toBeInTheDocument();
      expect(screen.getByText('1-2 Bedroom Kit')).toBeInTheDocument();
      expect(screen.getByText('3-4 Bedroom Kit')).toBeInTheDocument();
    });

    it('should render kit prices correctly', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByText('$197')).toBeInTheDocument();
      expect(screen.getByText('$348')).toBeInTheDocument();
      expect(screen.getByText('$521')).toBeInTheDocument();
    });

    it('should render kit descriptions', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByText('studio or small moving project')).toBeInTheDocument();
      expect(screen.getByText('one to two bedroom house/apt')).toBeInTheDocument();
      expect(screen.getByText('three to four bedroom household')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByLabelText('Scroll left to view previous packing kits')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll right to view next packing kits')).toBeInTheDocument();
    });

    it('should render Add to Cart buttons for each kit', () => {
      render(<PackingKits {...defaultProps} />);

      const addToCartButtons = screen.getAllByRole('button', { name: /Add.*to cart/i });
      expect(addToCartButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('should render More Details buttons for each kit', () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });
      expect(moreDetailsButtons).toHaveLength(3);
    });
  });

  describe('Add to Cart Functionality', () => {
    it('should call onAddToCart with correct items when clicking Add to Cart on Apartment Kit', () => {
      render(<PackingKits {...defaultProps} />);

      const addToCartButtons = screen.getAllByRole('button', { name: /Add.*to cart/i });
      fireEvent.click(addToCartButtons[0]);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Medium Box', quantity: 5, price: 3.15 }),
          expect.objectContaining({ name: 'Large Box', quantity: 10, price: 4.15 }),
          expect.objectContaining({ name: 'Packing Paper', quantity: 1, price: 25 }),
        ])
      );
    });

    it('should call onAddToCart with correct items when clicking Add to Cart on 1-2 Bedroom Kit', () => {
      render(<PackingKits {...defaultProps} />);

      const addToCartButtons = screen.getAllByRole('button', { name: /Add.*to cart/i });
      fireEvent.click(addToCartButtons[1]);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Small Box', quantity: 2, price: 2.15 }),
          expect.objectContaining({ name: 'Wardrobe Box', quantity: 1, price: 22.25 }),
        ])
      );
    });

    it('should call onAddToCart with correct items when clicking Add to Cart on 3-4 Bedroom Kit', () => {
      render(<PackingKits {...defaultProps} />);

      const addToCartButtons = screen.getAllByRole('button', { name: /Add.*to cart/i });
      fireEvent.click(addToCartButtons[2]);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Small Box', quantity: 5, price: 2.15 }),
          expect.objectContaining({ name: 'Large Box', quantity: 20, price: 4.15 }),
        ])
      );
    });
  });

  describe('Modal Functionality', () => {
    it('should open modal when clicking More Details', async () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });
      fireEvent.click(moreDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Apartment Kit');
      });
    });

    it('should display kit details in modal', async () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });
      fireEvent.click(moreDetailsButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText(/This kit is perfect for a studio or small moving project/)
        ).toBeInTheDocument();
        expect(screen.getByText('Items Included')).toBeInTheDocument();
      });
    });

    it('should display all items in modal', async () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });
      fireEvent.click(moreDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('5x Medium Box')).toBeInTheDocument();
        expect(screen.getByText('10x Large Box')).toBeInTheDocument();
        expect(screen.getByText('1x Packing Paper')).toBeInTheDocument();
        expect(screen.getByText('1x Mattress Cover')).toBeInTheDocument();
      });
    });

    it('should display price and Add to Cart button in modal', async () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });
      fireEvent.click(moreDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
        const modalContent = screen.getByTestId('modal-content');
        expect(modalContent).toHaveTextContent('$197');
      });
    });

    it('should close modal when clicking close button', async () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });
      fireEvent.click(moreDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('should add items to cart and close modal when clicking Add to Cart in modal', async () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });
      fireEvent.click(moreDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      // Find the Add to Cart button inside modal content
      const modalContent = screen.getByTestId('modal-content');
      const addToCartButton = screen.getAllByRole('button', { name: /Add.*to cart/i }).find((btn) =>
        modalContent.contains(btn)
      );

      expect(addToCartButton).toBeInTheDocument();
      if (addToCartButton) {
        fireEvent.click(addToCartButton);
      }

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Scroll Functionality', () => {
    beforeEach(() => {
      // Mock scrollTo function for JSDOM
      Element.prototype.scrollTo = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should have scroll navigation buttons', () => {
      render(<PackingKits {...defaultProps} />);

      const leftButton = screen.getByLabelText('Scroll left to view previous packing kits');
      const rightButton = screen.getByLabelText('Scroll right to view next packing kits');

      expect(leftButton).toBeInTheDocument();
      expect(rightButton).toBeInTheDocument();
    });

    it('should call scroll function when clicking navigation buttons', () => {
      const scrollToMock = jest.fn();
      Element.prototype.scrollTo = scrollToMock;

      render(<PackingKits {...defaultProps} />);

      const leftButton = screen.getByLabelText('Scroll left to view previous packing kits');
      const rightButton = screen.getByLabelText('Scroll right to view next packing kits');

      // Click navigation buttons
      fireEvent.click(leftButton);
      expect(scrollToMock).toHaveBeenCalled();

      scrollToMock.mockClear();

      fireEvent.click(rightButton);
      expect(scrollToMock).toHaveBeenCalled();
    });
  });

  describe('Design System Compliance', () => {
    it('should use design system colors for free delivery badge', () => {
      render(<PackingKits {...defaultProps} />);

      const badge = screen.getByText('Free delivery').parentElement;
      expect(badge).toHaveClass('bg-status-bg-success');
      expect(badge).toHaveClass('text-status-text-success');
    });

    it('should use design system colors for navigation buttons', () => {
      render(<PackingKits {...defaultProps} />);

      const leftButton = screen.getByLabelText('Scroll left to view previous packing kits');
      expect(leftButton).toHaveClass('bg-surface-tertiary');
      expect(leftButton).toHaveClass('active:bg-surface-disabled');
    });

    it('should use design system colors for Add to Cart buttons', () => {
      render(<PackingKits {...defaultProps} />);

      const addToCartButtons = screen.getAllByRole('button', { name: /Add.*to cart/i });
      // Check the first Add to Cart button (main card button, not modal button)
      expect(addToCartButtons[0]).toHaveClass('text-primary');
    });

    it('should use design system colors for kit card backgrounds', () => {
      const { container } = render(<PackingKits {...defaultProps} />);

      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('bg-surface-tertiary');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<PackingKits {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for scroll container', () => {
      render(<PackingKits {...defaultProps} />);

      const scrollContainer = screen.getByRole('region', { name: 'Packing kits gallery' });
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper ARIA attributes for free delivery badge', () => {
      render(<PackingKits {...defaultProps} />);

      const badge = screen.getByLabelText('Free delivery available');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should have aria-hidden on decorative icons', () => {
      render(<PackingKits {...defaultProps} />);

      const leftIcon = screen.getByTestId('arrow-left-icon');
      const rightIcon = screen.getByTestId('arrow-right-icon');

      expect(leftIcon).toHaveAttribute('aria-hidden', 'true');
      expect(rightIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have descriptive aria-labels for navigation buttons', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByLabelText('Scroll left to view previous packing kits')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll right to view next packing kits')).toBeInTheDocument();
    });

    it('should have descriptive aria-labels for Add to Cart buttons', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByLabelText(/Add Apartment Kit to cart/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Add 1-2 Bedroom Kit to cart/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Add 3-4 Bedroom Kit to cart/i)).toBeInTheDocument();
    });

    it('should have descriptive aria-labels for More Details buttons', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByLabelText('View more details about Apartment Kit')).toBeInTheDocument();
      expect(screen.getByLabelText('View more details about 1-2 Bedroom Kit')).toBeInTheDocument();
      expect(screen.getByLabelText('View more details about 3-4 Bedroom Kit')).toBeInTheDocument();
    });

    it('should use semantic HTML with article elements', () => {
      const { container } = render(<PackingKits {...defaultProps} />);

      const articles = container.querySelectorAll('article');
      expect(articles.length).toBe(3);
    });

    it('should have proper heading hierarchy', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2, name: 'Packing Supplies' })).toBeInTheDocument();
    });
  });

  describe('Image Rendering', () => {
    it('should render images for all kits with proper alt text', () => {
      render(<PackingKits {...defaultProps} />);

      expect(screen.getByAltText('Apartment Kit packing supplies kit')).toBeInTheDocument();
      expect(screen.getByAltText('1-2 Bedroom Kit packing supplies kit')).toBeInTheDocument();
      expect(screen.getByAltText('3-4 Bedroom Kit packing supplies kit')).toBeInTheDocument();
    });

    it('should use correct image sources', () => {
      render(<PackingKits {...defaultProps} />);

      const apartmentImage = screen.getByAltText('Apartment Kit packing supplies kit');
      const bedroomImage = screen.getByAltText('1-2 Bedroom Kit packing supplies kit');
      const largeBedroomImage = screen.getByAltText('3-4 Bedroom Kit packing supplies kit');

      expect(apartmentImage).toHaveAttribute('src', '/img/golden-gate.png');
      expect(bedroomImage).toHaveAttribute('src', '/img/mountain-view.png');
      expect(largeBedroomImage).toHaveAttribute('src', '/img/palo-alto.png');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid clicks on Add to Cart', () => {
      render(<PackingKits {...defaultProps} />);

      const addToCartButton = screen.getAllByRole('button', { name: /Add.*to cart/i })[0];

      fireEvent.click(addToCartButton);
      fireEvent.click(addToCartButton);
      fireEvent.click(addToCartButton);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(3);
    });

    it('should handle opening different kit modals sequentially', async () => {
      render(<PackingKits {...defaultProps} />);

      const moreDetailsButtons = screen.getAllByRole('button', { name: /View more details/i });

      // Open first kit modal
      fireEvent.click(moreDetailsButtons[0]);
      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Apartment Kit');
      });

      // Close modal
      fireEvent.click(screen.getByTestId('modal-close'));
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Open second kit modal
      fireEvent.click(moreDetailsButtons[1]);
      await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('1-2 Bedroom Kit');
      });
    });
  });
});

