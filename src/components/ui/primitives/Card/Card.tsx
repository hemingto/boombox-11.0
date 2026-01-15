/**
 * @fileoverview Card component for displaying content with image, title, and description
 * @source boombox-10.0/src/app/components/reusablecomponents/card.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a content card with an image on the left and text content on the right.
 * Supports blog posts, location cards, and general content display with optional
 * author, read time, customer count, and description fields.
 * 
 * API ROUTES UPDATED:
 * - No API routes in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom colors with design system tokens (surface, text, border)
 * - Used semantic color system for hover states and text hierarchy
 * - Applied design system border and shadow utilities
 * - Integrated with design system typography scale
 * 
 * @refactor Improved accessibility with proper ARIA labels, semantic HTML structure,
 * and keyboard navigation support. Enhanced type safety and component flexibility.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface CardProps {
  /**
   * The path to the image
   */
  imageSrc: string;
  
  /**
   * Alt text for the image (required for accessibility)
   */
  imageAlt: string;
  
  /**
   * Location or primary heading text
   */
  location?: string;
  
  /**
   * Blog title or secondary heading text
   */
  blogtitle?: string;
  
  /**
   * Description text content
   */
  description?: string;
  
  /**
   * Customer count or numerical data
   */
  customerCount?: string;
  
  /**
   * Link URL for navigation
   */
  link: string;
  
  /**
   * Author name for blog posts
   */
  author?: string;
  
  /**
   * Read time estimate for blog posts
   */
  readTime?: string;
  
  /**
   * Additional CSS classes for customization
   */
  className?: string;
  
  /**
   * Whether to open link in new tab
   */
  external?: boolean;
  
  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

export const Card: React.FC<CardProps> = ({ 
  imageSrc, 
  imageAlt, 
  location, 
  blogtitle, 
  description, 
  customerCount, 
  link, 
  author, 
  readTime,
  className = '',
  external = false,
  ariaLabel
}) => {
  // Construct accessible label
  const accessibleLabel = ariaLabel || `${location || blogtitle || 'Card'} - ${description || 'View details'}`;
  
  const cardContent = (
    <article 
      className={`flex items-stretch h-40 rounded-md overflow-hidden transform transition-all duration-300 hover:scale-[102%] hover:z-10 cursor-pointer group ${className}`}
      role="article"
      aria-label={accessibleLabel}
    >
      {/* Image Section */}
      <div className="relative w-2/5 h-full overflow-hidden rounded-tl-md rounded-bl-md">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="transition-transform duration-300 group-hover:scale-105 object-cover rounded-tl-md rounded-bl-md"
          sizes="(max-width: 768px) 40vw, 20vw"
        />
      </div>
      
      {/* Content Section */}
      <div className="w-3/5 flex flex-col justify-center p-4 border-t border-b border-r border-slate-100 bg-surface-primary rounded-tr-md rounded-br-md">
        {/* Primary heading */}
        {location && (
          <h2 className="text-text-primary font-semibold text-lg mb-1 truncate">
            {location}
          </h2>
        )}
        
        {/* Secondary heading */}
        {blogtitle && (
          <h3 className="text-text-primary font-medium text-base mb-2 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {blogtitle}
          </h3>
        )}
        
        {/* Description with customer count */}
        {(customerCount || description) && (
          <p className="text-text-primary text-sm mb-2 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {customerCount && (
              <span className="font-medium text-text-primary">{customerCount}</span>
            )}
            {customerCount && description && ' '}
            {description}
          </p>
        )}
        
        {/* Author and read time */}
        {(author || readTime) && (
          <div className="text-text-tertiary text-xs flex items-center gap-1">
            {author && <span>{author}</span>}
            {readTime && <span>{readTime}</span>}
          </div>
        )}
      </div>
    </article>
  );

  // Wrap in Link component
  return (
    <Link 
      href={link}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={accessibleLabel}
    >
      {cardContent}
    </Link>
  );
};

export default Card;
