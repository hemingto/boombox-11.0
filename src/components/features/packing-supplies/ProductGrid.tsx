/**
 * @fileoverview Product grid component for displaying packing supplies by category
 * @source boombox-10.0/src/app/components/packing-supplies/productgrid.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays packing supply products grouped by category (Moving Boxes, Tape, etc.)
 * Products are shown in a responsive grid layout with category headings.
 * Moving Boxes category is always displayed first.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic heading levels (h2 for category titles)
 * - Responsive grid with Tailwind breakpoints
 * - Proper spacing and typography scale
 * 
 * @refactor Applied design system patterns, extracted grouping logic
 */

import { ProductCard } from '@/components/ui/primitives/ProductCard/ProductCard';
import type { Product } from '@/types/product.types';

interface ProductGridProps {
  products: Product[];
  cartItems: { name: string; quantity: number }[];
  onAddToCart: (product: Product, quantity: number) => void;
}

/**
 * Group products by their category
 */
const groupProductsByCategory = (products: Product[]): Record<string, Product[]> => {
  return products.reduce((acc: Record<string, Product[]>, product: Product) => {
    const { category } = product;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});
};

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  cartItems, 
  onAddToCart 
}) => {
  /**
   * Get the quantity from cart for a specific product
   */
  const getCartQuantity = (productTitle: string): number => {
    const cartItem = cartItems.find(item => item.name === productTitle);
    return cartItem ? cartItem.quantity : 0;
  };

  const groupedProducts = groupProductsByCategory(products);

  // Sort categories to show Moving Boxes first
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    if (a === 'Moving Boxes') return -1;
    if (b === 'Moving Boxes') return 1;
    return a.localeCompare(b);
  });

  return (
    <div>
      {sortedCategories.map((category: string) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{category}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {groupedProducts[category].map((product: Product) => (
              <ProductCard
                key={product.productid}
                product={product}
                cartQuantity={getCartQuantity(product.title)}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

