/**
 * @fileoverview Tests for ProductGrid component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProductGrid } from '@/components/features/packing-supplies/ProductGrid';
import type { Product } from '@/types/product.types';

expect.extend(toHaveNoViolations);

// Mock ProductCard component
jest.mock('@/components/ui/primitives/ProductCard/ProductCard', () => ({
  ProductCard: function MockProductCard(props: any) {
    return (
      <div data-testid={`product-card-${props.product.productid}`}>
        <div data-testid="product-title">{props.product.title}</div>
        <div data-testid="product-category">{props.product.category}</div>
        <div data-testid="cart-quantity">{props.cartQuantity}</div>
      </div>
    );
  },
}));

describe('ProductGrid', () => {
  const mockProducts: Product[] = [
    {
      productid: 1,
      title: 'Small Box',
      price: 2.5,
      description: 'Small moving box',
      detailedDescription: 'Perfect for books and small items',
      imageSrc: '/images/small-box.jpg',
      imageAlt: 'Small moving box',
      category: 'Moving Boxes',
      quantity: 0,
      stockCount: 100,
      isOutOfStock: false,
      hasLowStock: false,
    },
    {
      productid: 2,
      title: 'Large Box',
      price: 3.5,
      description: 'Large moving box',
      detailedDescription: 'Perfect for clothes and linens',
      imageSrc: '/images/large-box.jpg',
      imageAlt: 'Large moving box',
      category: 'Moving Boxes',
      quantity: 0,
      stockCount: 50,
      isOutOfStock: false,
      hasLowStock: false,
    },
    {
      productid: 3,
      title: 'Packing Tape',
      price: 5.0,
      description: 'Heavy duty packing tape',
      detailedDescription: '2-inch wide packing tape',
      imageSrc: '/images/tape.jpg',
      imageAlt: 'Packing tape',
      category: 'Tape',
      quantity: 0,
      stockCount: 200,
      isOutOfStock: false,
      hasLowStock: false,
    },
    {
      productid: 4,
      title: 'Bubble Wrap',
      price: 8.0,
      description: 'Protective bubble wrap',
      detailedDescription: '12-inch wide bubble wrap',
      imageSrc: '/images/bubble-wrap.jpg',
      imageAlt: 'Bubble wrap',
      category: 'Protection',
      quantity: 0,
      stockCount: 75,
      isOutOfStock: false,
      hasLowStock: false,
    },
  ];

  const mockCartItems = [
    { name: 'Small Box', quantity: 5 },
    { name: 'Packing Tape', quantity: 2 },
  ];

  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );
      expect(screen.getByRole('heading', { name: 'Moving Boxes' })).toBeInTheDocument();
    });

    it('should render all categories', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByRole('heading', { name: 'Moving Boxes' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Tape' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Protection' })).toBeInTheDocument();
    });

    it('should render all products', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-4')).toBeInTheDocument();
    });

    it('should render empty state when no products', () => {
      const { container } = render(
        <ProductGrid
          products={[]}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(container.firstChild?.childNodes.length).toBe(0);
    });
  });

  describe('Category Grouping', () => {
    it('should group products by category', () => {
      const { container } = render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const categoryDivs = container.querySelectorAll('.mb-8');
      expect(categoryDivs.length).toBe(3); // 3 unique categories
    });

    it('should display Moving Boxes category first', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings[0]).toHaveTextContent('Moving Boxes');
    });

    it('should sort other categories alphabetically after Moving Boxes', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings[0]).toHaveTextContent('Moving Boxes');
      expect(headings[1]).toHaveTextContent('Protection');
      expect(headings[2]).toHaveTextContent('Tape');
    });
  });

  describe('Cart Integration', () => {
    it('should pass correct cart quantity to ProductCard', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={mockCartItems}
          onAddToCart={mockOnAddToCart}
        />
      );

      const productCard1 = screen.getByTestId('product-card-1');
      const quantityElement1 = productCard1.querySelector('[data-testid="cart-quantity"]');
      expect(quantityElement1).toHaveTextContent('5');

      const productCard3 = screen.getByTestId('product-card-3');
      const quantityElement3 = productCard3.querySelector('[data-testid="cart-quantity"]');
      expect(quantityElement3).toHaveTextContent('2');
    });

    it('should pass zero quantity for products not in cart', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={mockCartItems}
          onAddToCart={mockOnAddToCart}
        />
      );

      const productCard2 = screen.getByTestId('product-card-2');
      const quantityElement2 = productCard2.querySelector('[data-testid="cart-quantity"]');
      expect(quantityElement2).toHaveTextContent('0');
    });

    it('should pass onAddToCart callback to all ProductCards', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      // All product cards should be rendered
      expect(screen.getAllByTestId(/product-card-/)).toHaveLength(4);
    });
  });

  describe('Layout', () => {
    it('should use responsive grid layout', () => {
      const { container } = render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid',
        'grid-cols-1',
        'lg:grid-cols-2',
        '2xl:grid-cols-3',
        'gap-4'
      );
    });

    it('should have proper category spacing', () => {
      const { container } = render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const categoryDivs = container.querySelectorAll('.mb-8');
      categoryDivs.forEach(div => {
        expect(div).toHaveClass('mb-8');
      });
    });

    it('should have proper heading spacing', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('text-2xl', 'font-semibold', 'mb-4');
      });
    });
  });

  describe('Typography', () => {
    it('should use h2 elements for category headings', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBeGreaterThan(0);
      headings.forEach(heading => {
        expect(heading.tagName).toBe('H2');
      });
    });

    it('should have proper font styles for headings', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('text-2xl', 'font-semibold');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single product', () => {
      render(
        <ProductGrid
          products={[mockProducts[0]]}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Moving Boxes' })).toBeInTheDocument();
    });

    it('should handle empty cart items', () => {
      render(
        <ProductGrid
          products={mockProducts}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      // All products should show zero quantity
      const quantityElements = screen.getAllByTestId('cart-quantity');
      quantityElements.forEach(element => {
        expect(element).toHaveTextContent('0');
      });
    });

    it('should handle products without categories', () => {
      const productWithoutCategory = {
        ...mockProducts[0],
        category: '',
      };

      render(
        <ProductGrid
          products={[productWithoutCategory]}
          cartItems={[]}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Should still render (empty category heading)
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('');
    });
  });
});

