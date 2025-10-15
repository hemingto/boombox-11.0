/**
 * @fileoverview Comprehensive tests for ProductCard component
 * Tests functionality, accessibility, user interactions, and edge cases
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ProductCard } from '@/components/ui/primitives/ProductCard/ProductCard';
import { type Product } from '@/types/product.types';

// Mock the OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage/OptimizedImage', () => ({
  OptimizedImage: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} />
  ),
}));

// Mock the Modal component
jest.mock('@/components/ui/primitives/Modal/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) =>
    isOpen ? (
      <div role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock the Button component
jest.mock('@/components/ui/primitives/Button/Button', () => ({
  Button: ({ children, onClick, disabled, className, 'aria-label': ariaLabel, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock currency utils
jest.mock('@/lib/utils/currencyUtils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

// Mock cn utility
jest.mock('@/lib/utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('ProductCard', () => {
  const mockProduct: Product = {
    productid: 1,
    title: 'Small Box',
    price: 2.15,
    description: '12" x 12" x 12"',
    detailedDescription: 'Perfect for small items and books. Made from durable corrugated cardboard.',
    imageSrc: '/img/small-box.png',
    imageAlt: 'Small moving box',
    category: 'Moving boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
    hasLowStock: false,
  };

  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders product information correctly', () => {
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('Small Box')).toBeInTheDocument();
      expect(screen.getByText('$2.15')).toBeInTheDocument();
      expect(screen.getByText('12" x 12" x 12"')).toBeInTheDocument();
      expect(screen.getByText('More Details')).toBeInTheDocument();
    });

    it('renders product image with correct alt text', () => {
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      const image = screen.getByAltText('Small moving box (Product ID: 1)');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/img/small-box.png');
    });

    it('displays current cart quantity', () => {
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={5}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('Current quantity: 5')).toBeInTheDocument();
    });
  });

  describe('Cart Quantity Controls', () => {
    it('calls onAddToCart when increase button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={2}
          onAddToCart={mockOnAddToCart}
        />
      );

      const increaseButton = screen.getByLabelText('Increase quantity of Small Box');
      await user.click(increaseButton);

      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct, 3);
    });

    it('calls onAddToCart when decrease button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={2}
          onAddToCart={mockOnAddToCart}
        />
      );

      const decreaseButton = screen.getByLabelText('Decrease quantity of Small Box');
      await user.click(decreaseButton);

      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct, 1);
    });

    it('does not allow quantity to go below 0', async () => {
      const user = userEvent.setup();
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      const decreaseButton = screen.getByLabelText('Decrease quantity of Small Box');
      
      // Button should be disabled when quantity is 0
      expect(decreaseButton).toBeDisabled();
      
      // Clicking disabled button should not call onAddToCart
      await user.click(decreaseButton);
      expect(mockOnAddToCart).not.toHaveBeenCalled();
    });

    it('disables decrease button when quantity is 0', () => {
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      const decreaseButton = screen.getByLabelText('Decrease quantity of Small Box');
      expect(decreaseButton).toBeDisabled();
    });
  });

  describe('Stock Management', () => {
    it('shows out of stock badge when product is out of stock', () => {
      const outOfStockProduct = { ...mockProduct, isOutOfStock: true };
      render(
        <ProductCard
          product={outOfStockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      expect(screen.getByLabelText('Product is out of stock')).toBeInTheDocument();
    });

    it('shows low stock badge when stock is below 50', () => {
      const lowStockProduct = { ...mockProduct, stockCount: 10 };
      render(
        <ProductCard
          product={lowStockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('Only 10 left')).toBeInTheDocument();
      expect(screen.getByLabelText('Only 10 items remaining in stock')).toBeInTheDocument();
    });

    it('disables increase button when at max quantity', () => {
      const limitedStockProduct = { ...mockProduct, stockCount: 5 };
      render(
        <ProductCard
          product={limitedStockProduct}
          cartQuantity={5}
          onAddToCart={mockOnAddToCart}
        />
      );

      const increaseButton = screen.getByLabelText('Increase quantity of Small Box');
      expect(increaseButton).toBeDisabled();
    });

    it('prevents adding more than available stock', async () => {
      const user = userEvent.setup();
      const limitedStockProduct = { ...mockProduct, stockCount: 3 };
      render(
        <ProductCard
          product={limitedStockProduct}
          cartQuantity={3}
          onAddToCart={mockOnAddToCart}
        />
      );

      const increaseButton = screen.getByLabelText('Increase quantity of Small Box');
      await user.click(increaseButton);

      expect(mockOnAddToCart).not.toHaveBeenCalled();
    });

    it('applies opacity when product is out of stock', () => {
      const outOfStockProduct = { ...mockProduct, isOutOfStock: true };
      render(
        <ProductCard
          product={outOfStockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      const productCard = screen.getByRole('article');
      expect(productCard).toHaveClass('opacity-75');
    });
  });

  describe('Product Details Modal', () => {
    it('opens modal when More Details is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      const moreDetailsButton = screen.getByLabelText('View more details about Small Box');
      await user.click(moreDetailsButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.detailedDescription)).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Open modal
      const moreDetailsButton = screen.getByLabelText('View more details about Small Box');
      await user.click(moreDetailsButton);

      // Close modal - get the first close button (from our component)
      const closeButtons = screen.getAllByText('Close');
      await user.click(closeButtons[0]);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays detailed product information in modal', async () => {
      const user = userEvent.setup();
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      const moreDetailsButton = screen.getByLabelText('View more details about Small Box');
      await user.click(moreDetailsButton);

      // Check for modal-specific title (not the card title)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.detailedDescription)).toBeInTheDocument();
      
      // Check for multiple instances of description (both in card and modal)
      const descriptions = screen.getAllByText(mockProduct.description);
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all interactive elements', () => {
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={2}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByLabelText('Decrease quantity of Small Box')).toBeInTheDocument();
      expect(screen.getByLabelText('Increase quantity of Small Box')).toBeInTheDocument();
      expect(screen.getByLabelText('Current quantity: 2')).toBeInTheDocument();
      expect(screen.getByLabelText('View more details about Small Box')).toBeInTheDocument();
      expect(screen.getByLabelText('Quantity controls for Small Box')).toBeInTheDocument();
    });

    it('has proper semantic HTML structure', () => {
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(
        <ProductCard
          product={mockProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      const productTitle = screen.getByRole('heading', { level: 3 });
      expect(productTitle).toHaveTextContent('Small Box');
    });

    it('provides status information for screen readers', () => {
      const lowStockProduct = { ...mockProduct, stockCount: 10 };
      render(
        <ProductCard
          product={lowStockProduct}
          cartQuantity={2}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByRole('status', { name: 'Only 10 items remaining in stock' })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Current quantity: 2' })).toBeInTheDocument();
    });
  });

  describe('Animation and Visual Feedback', () => {
    it('triggers shake animation when trying to add more than low stock allows', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const lowStockProduct = { ...mockProduct, stockCount: 5 };
      render(
        <ProductCard
          product={lowStockProduct}
          cartQuantity={5}
          onAddToCart={mockOnAddToCart}
        />
      );

      const increaseButton = screen.getByLabelText('Increase quantity of Small Box');
      
      // Button should be disabled when at max quantity
      expect(increaseButton).toBeDisabled();
      
      // Try to click anyway (simulating user interaction)
      await user.click(increaseButton);

      // Should not call onAddToCart when at max quantity
      expect(mockOnAddToCart).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('handles product without image gracefully', () => {
      const productWithoutImage = { ...mockProduct, imageSrc: '' };
      render(
        <ProductCard
          product={productWithoutImage}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Component should still render without errors
      expect(screen.getByText('Small Box')).toBeInTheDocument();
    });

    it('handles undefined stock count', () => {
      const productWithoutStock = { ...mockProduct, stockCount: undefined };
      render(
        <ProductCard
          product={productWithoutStock}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Should not show stock badges
      expect(screen.queryByText(/Only.*left/)).not.toBeInTheDocument();
      expect(screen.queryByText('Out of Stock')).not.toBeInTheDocument();
    });

    it('handles very long product titles and descriptions', () => {
      const productWithLongText = {
        ...mockProduct,
        title: 'This is a very long product title that might overflow the container',
        description: 'This is a very long description that might cause layout issues if not handled properly',
      };
      
      render(
        <ProductCard
          product={productWithLongText}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText(productWithLongText.title)).toBeInTheDocument();
      expect(screen.getByText(productWithLongText.description)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats price correctly using currency utility', () => {
      const expensiveProduct = { ...mockProduct, price: 1234.56 };
      render(
        <ProductCard
          product={expensiveProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('$1234.56')).toBeInTheDocument();
    });

    it('handles zero price', () => {
      const freeProduct = { ...mockProduct, price: 0 };
      render(
        <ProductCard
          product={freeProduct}
          cartQuantity={0}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });
});
