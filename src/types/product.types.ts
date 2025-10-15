/**
 * @fileoverview Product type definitions for the Boombox application
 * @source boombox-10.0/src/app/data/productdata.tsx
 */

export interface Product {
  productid: number;
  title: string;
  price: number;
  description: string;
  detailedDescription: string;
  imageSrc: string;
  imageAlt: string;
  category: string;
  quantity: number;
  stockCount?: number;
  isOutOfStock?: boolean;
  hasLowStock?: boolean;
}

export interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product, quantity: number) => void;
}

export interface StockStatus {
  isOutOfStock: boolean;
  isLowStock: boolean;
  isAtMaxQuantity: boolean;
}
