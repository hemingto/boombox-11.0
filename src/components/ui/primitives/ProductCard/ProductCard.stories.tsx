/**
 * @fileoverview ProductCard component stories for Storybook
 * ProductCard component for displaying packing supply products with cart functionality
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProductCard } from './ProductCard';
import { type Product } from '@/types/product.types';

// Mock product data for stories
const mockProducts: Record<string, Product> = {
  smallBox: {
    productid: 1,
    title: 'Small Box',
    price: 2.15,
    description: '12" x 12" x 12"',
    detailedDescription: 'Perfect for small items and books. Made from durable corrugated cardboard with reinforced corners for extra strength.',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Small moving box',
    category: 'Moving boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
    hasLowStock: false,
  },
  mediumBox: {
    productid: 2,
    title: 'Medium Box',
    price: 3.15,
    description: '16" x 12" x 12"',
    detailedDescription: 'Ideal for clothes, linens, and medium-sized items. Features easy-grip handles and a secure bottom.',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Medium moving box',
    category: 'Moving boxes',
    quantity: 0,
    stockCount: 75,
    isOutOfStock: false,
    hasLowStock: false,
  },
  wardrobeBox: {
    productid: 3,
    title: 'Wardrobe Box',
    price: 22.25,
    description: '24" x 21" x 48"',
    detailedDescription: 'Extra tall box with built-in metal hanging bar. Perfect for transporting clothes without wrinkles.',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Wardrobe box with hanging bar',
    category: 'Moving boxes',
    quantity: 0,
    stockCount: 25,
    isOutOfStock: false,
    hasLowStock: false,
  },
  bubbleWrap: {
    productid: 4,
    title: 'Bubble Wrap',
    price: 20.25,
    description: '12" x 30ft roll',
    detailedDescription: 'High-quality bubble wrap for protecting fragile items. Features large bubbles for maximum cushioning.',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Bubble wrap roll',
    category: 'Packing supplies',
    quantity: 0,
    stockCount: 50,
    isOutOfStock: false,
    hasLowStock: false,
  },
  lowStockItem: {
    productid: 5,
    title: 'Packing Tape',
    price: 15.00,
    description: '6 rolls pack',
    detailedDescription: 'Heavy-duty packing tape that sticks to any surface. Each roll is 2 inches wide and 55 yards long.',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Packing tape rolls',
    category: 'Packing supplies',
    quantity: 0,
    stockCount: 8,
    isOutOfStock: false,
    hasLowStock: true,
  },
  outOfStockItem: {
    productid: 6,
    title: 'Moving Blankets',
    price: 40.00,
    description: '5 pack premium',
    detailedDescription: 'Professional-grade moving blankets made from recycled materials. Provides excellent protection for furniture.',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Moving blankets',
    category: 'Packing supplies',
    quantity: 0,
    stockCount: 0,
    isOutOfStock: true,
    hasLowStock: false,
  },
};

const meta = {
  title: 'Components/UI/Primitives/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A product card component for displaying packing supply products with cart functionality, stock management, and detailed product information modal.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    product: {
      control: 'object',
      description: 'Product data object containing all product information',
    },
    cartQuantity: {
      control: { type: 'number', min: 0, max: 50 },
      description: 'Current quantity of this product in the cart',
    },
    onAddToCart: {
      action: 'onAddToCart',
      description: 'Callback function called when cart quantity changes',
    },
  },
  args: {
    cartQuantity: 0,
    onAddToCart: (product: Product, quantity: number) => {
      console.log(`Cart updated: ${product.title} - Quantity: ${quantity}`);
    },
  },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    product: mockProducts.smallBox,
    cartQuantity: 0,
  },
};

// Product variants
export const SmallBox: Story = {
  args: {
    product: mockProducts.smallBox,
    cartQuantity: 2,
  },
};

export const MediumBox: Story = {
  args: {
    product: mockProducts.mediumBox,
    cartQuantity: 1,
  },
};

export const WardrobeBox: Story = {
  args: {
    product: mockProducts.wardrobeBox,
    cartQuantity: 0,
  },
};

export const PackingSupplies: Story = {
  args: {
    product: mockProducts.bubbleWrap,
    cartQuantity: 3,
  },
};

// Stock status variants
export const LowStock: Story = {
  args: {
    product: mockProducts.lowStockItem,
    cartQuantity: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product with low stock (less than 50 items) shows a warning badge.',
      },
    },
  },
};

export const OutOfStock: Story = {
  args: {
    product: mockProducts.outOfStockItem,
    cartQuantity: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Out of stock products are disabled and show an appropriate badge.',
      },
    },
  },
};

export const AtMaxQuantity: Story = {
  args: {
    product: {
      ...mockProducts.lowStockItem,
      stockCount: 5,
    },
    cartQuantity: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'When cart quantity equals stock count, the increase button is disabled.',
      },
    },
  },
};

// Interactive states
export const WithCartItems: Story = {
  args: {
    product: mockProducts.smallBox,
    cartQuantity: 7,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product card with items already in cart showing quantity controls.',
      },
    },
  },
};

export const EmptyCart: Story = {
  args: {
    product: mockProducts.mediumBox,
    cartQuantity: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product card with no items in cart - decrease button is disabled.',
      },
    },
  },
};

// Price variants
export const ExpensiveItem: Story = {
  args: {
    product: {
      ...mockProducts.wardrobeBox,
      price: 125.99,
    },
    cartQuantity: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product with higher price point showing proper currency formatting.',
      },
    },
  },
};

export const FreeItem: Story = {
  args: {
    product: {
      ...mockProducts.smallBox,
      price: 0,
      title: 'Free Sample Box',
      description: 'Complimentary sample',
    },
    cartQuantity: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Free product showing $0.00 price formatting.',
      },
    },
  },
};

// Layout variants
export const LongTitle: Story = {
  args: {
    product: {
      ...mockProducts.smallBox,
      title: 'Extra Large Heavy Duty Professional Moving Box with Reinforced Corners',
      description: 'Very detailed specifications here',
    },
    cartQuantity: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product with very long title showing text truncation.',
      },
    },
  },
};

export const LongDescription: Story = {
  args: {
    product: {
      ...mockProducts.bubbleWrap,
      description: 'Premium quality 12" x 30ft roll with extra cushioning and superior adhesion properties',
    },
    cartQuantity: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product with long description showing proper text wrapping.',
      },
    },
  },
};

// Edge cases
export const NoImage: Story = {
  args: {
    product: {
      ...mockProducts.smallBox,
      imageSrc: '',
      imageAlt: 'No image available',
    },
    cartQuantity: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product card gracefully handling missing product image.',
      },
    },
  },
};

export const UndefinedStock: Story = {
  args: {
    product: {
      ...mockProducts.smallBox,
      stockCount: undefined,
    },
    cartQuantity: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product with undefined stock count - no stock badges shown.',
      },
    },
  },
};

// Product showcase - multiple cards
export const ProductShowcase: Story = {
  args: {
    product: mockProducts.smallBox,
    cartQuantity: 0,
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <ProductCard
        product={mockProducts.smallBox}
        cartQuantity={2}
        onAddToCart={(product, quantity) => console.log(`${product.title}: ${quantity}`)}
      />
      <ProductCard
        product={mockProducts.mediumBox}
        cartQuantity={0}
        onAddToCart={(product, quantity) => console.log(`${product.title}: ${quantity}`)}
      />
      <ProductCard
        product={mockProducts.wardrobeBox}
        cartQuantity={1}
        onAddToCart={(product, quantity) => console.log(`${product.title}: ${quantity}`)}
      />
      <ProductCard
        product={mockProducts.bubbleWrap}
        cartQuantity={3}
        onAddToCart={(product, quantity) => console.log(`${product.title}: ${quantity}`)}
      />
      <ProductCard
        product={mockProducts.lowStockItem}
        cartQuantity={1}
        onAddToCart={(product, quantity) => console.log(`${product.title}: ${quantity}`)}
      />
      <ProductCard
        product={mockProducts.outOfStockItem}
        cartQuantity={0}
        onAddToCart={(product, quantity) => console.log(`${product.title}: ${quantity}`)}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple product cards showing different states and stock levels.',
      },
    },
  },
};

// Accessibility demonstration
export const AccessibilityDemo: Story = {
  args: {
    product: mockProducts.smallBox,
    cartQuantity: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Product card with full accessibility features including ARIA labels, keyboard navigation, and screen reader support. Try navigating with Tab key and using screen reader.',
      },
    },
  },
};

// Mobile responsive
export const MobileView: Story = {
  args: {
    product: mockProducts.mediumBox,
    cartQuantity: 2,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Product card optimized for mobile viewing with responsive layout.',
      },
    },
  },
};

// Dark mode (if supported)
export const DarkMode: Story = {
  args: {
    product: mockProducts.bubbleWrap,
    cartQuantity: 1,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Product card in dark mode using design system color tokens.',
      },
    },
  },
};
