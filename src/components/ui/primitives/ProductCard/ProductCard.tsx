/**
 * @fileoverview ProductCard component for displaying packing supply products with cart functionality
 * @source boombox-10.0/src/app/components/reusablecomponents/productcard.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays product information including image, title, price, and description
 * - Handles cart quantity management with stock validation
 * - Shows stock status indicators (out of stock, low stock)
 * - Provides detailed product information via popup modal
 * - Includes accessibility features for keyboard navigation and screen readers
 * 
 * API ROUTES UPDATED:
 * - No API routes used directly in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with design system tokens
 * - Updated button states to use semantic colors
 * - Applied consistent spacing and typography
 * - Used design system utility classes for badges and cards
 * 
 * @refactor Migrated to primitives with enhanced accessibility, design system compliance, and proper TypeScript interfaces
 */

import React, { useState } from 'react';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { type Product, type ProductCardProps } from '@/types/product.types';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { cn } from '@/lib/utils/cn';

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  cartQuantity, 
  onAddToCart 
}) => {
  const [shakeTag, setShakeTag] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stock status calculations
  const isOutOfStock = product.isOutOfStock || (product.stockCount !== undefined && product.stockCount <= 0);
  const isLowStock = product.stockCount !== undefined && product.stockCount < 50 && product.stockCount > 0;
  const isAtMaxQuantity = product.stockCount !== undefined && cartQuantity >= product.stockCount;

  const handleIncrease = () => {
    // Check stock availability before allowing increase
    if (product.stockCount !== undefined && cartQuantity >= product.stockCount) {
      // Trigger shake animation for low stock tag
      if (isLowStock) {
        setShakeTag(true);
        setTimeout(() => setShakeTag(false), 500);
      }
      return; // Don't allow adding more than available stock
    }
    const newQuantity = cartQuantity + 1;
    onAddToCart(product, newQuantity);
  };

  const handleDecrease = () => {
    const newQuantity = Math.max(0, cartQuantity - 1);
    onAddToCart(product, newQuantity);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <article 
        className={cn(
          'card',
          isOutOfStock && 'opacity-75'
        )}
        role="article"
        aria-labelledby={`product-title-${product.productid}`}
        aria-describedby={`product-description-${product.productid}`}
      >
        {/* Product Image Container */}
        <div className="relative bg-surface-tertiary rounded-t-md aspect-video">
          <OptimizedImage
            src={product.imageSrc}
            alt={`${product.imageAlt} (Product ID: ${product.productid})`}
            width={400}
            height={225}
            aspectRatio="video"
            containerClassName="rounded-t-md"
            className="rounded-t-md object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Stock Status Badges */}
          {isOutOfStock && (
            <div 
              className="badge-error absolute top-2 right-2"
              role="status"
              aria-label="Product is out of stock"
            >
              Out of Stock
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div 
              className={cn(
                'badge-warning absolute top-2 right-2 transition-transform duration-200',
                shakeTag && 'animate-bounce'
              )}
              role="status"
              aria-label={`Only ${product.stockCount} items remaining in stock`}
            >
              Only {product.stockCount} left
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="p-4 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <p 
              className="font-semibold text-lg text-text-primary"
              aria-label={`Price: ${formatCurrency(product.price)}`}
            >
              {formatCurrency(product.price)}
            </p>
            <h3 
              id={`product-title-${product.productid}`}
              className="font-medium text-text-primary truncate"
            >
              {product.title}
            </h3>
            <p 
              id={`product-description-${product.productid}`}
              className="text-xs text-text-secondary mt-1"
            >
              {product.description}
            </p>
          </div>

          {/* Cart Controls */}
          <div className="flex flex-col items-end ml-4">
            <div 
              className="flex items-center space-x-2 mb-2"
              role="group"
              aria-label={`Quantity controls for ${product.title}`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDecrease}
                disabled={cartQuantity === 0}
                aria-label={`Decrease quantity of ${product.title}`}
                className={cn(
                  'p-1 rounded-full',
                  cartQuantity === 0 
                    ? 'text-text-secondary cursor-not-allowed' 
                    : 'text-text-primary hover:bg-surface-secondary'
                )}
              >
                <MinusCircleIcon className="w-6 h-6" />
              </Button>
              
              <span 
                className="font-semibold text-md min-w-[2rem] text-center"
                aria-label={`Current quantity: ${cartQuantity}`}
                role="status"
              >
                {cartQuantity}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleIncrease}
                disabled={isOutOfStock || isAtMaxQuantity}
                aria-label={`Increase quantity of ${product.title}`}
                className={cn(
                  'p-1 rounded-full',
                  (isOutOfStock || isAtMaxQuantity)
                    ? 'text-text-secondary cursor-not-allowed'
                    : 'text-text-primary hover:bg-surface-secondary'
                )}
              >
                <PlusCircleIcon className="w-6 h-6" />
              </Button>
            </div>
            
            {/* More Details Link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openModal}
              className="text-xs text-text-secondary underline decoration-dotted underline-offset-4 hover:text-text-primary p-0 h-auto"
              aria-label={`View more details about ${product.title}`}
            >
              More Details
            </Button>
          </div>
        </div>
      </article>

      {/* Product Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={product.title}
        size="lg"
        aria-labelledby={`product-modal-title-${product.productid}`}
      >
        <div className="flex gap-4">
          {/* Product Image */}
          {product.imageSrc && (
            <div className="hidden sm:block shrink-0">
              <OptimizedImage
                src={product.imageSrc}
                alt={product.imageAlt}
                width={176}
                height={176}
                aspectRatio="square"
                containerClassName="w-44 h-44 bg-surface-tertiary rounded-md"
                className="rounded-md object-cover"
              />
            </div>
          )}
          
          {/* Product Details */}
          <div className="flex-1">
            <h2 
              id={`product-modal-title-${product.productid}`}
              className="text-2xl font-semibold mt-4 mb-4 text-text-primary"
            >
              {product.title}
            </h2>
            <div className="mb-4 leading-5 text-text-primary">
              {product.detailedDescription}
            </div>
            <div className="leading-5 font-semibold text-text-primary">
              {product.description}
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex justify-end">
          <Button
            variant="ghost"
            onClick={closeModal}
            className="underline text-sm"
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;
