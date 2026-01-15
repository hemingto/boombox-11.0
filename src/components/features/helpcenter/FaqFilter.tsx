/**
 * @fileoverview FAQ category filter component for help center
 * @source boombox-10.0/src/app/components/helpcenter/faqfilter.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides category-based filtering for FAQ content with tab navigation.
 * Users can select different categories to view filtered FAQ questions and answers.
 * Displays FAQs using the AccordionContainer primitive component.
 * 
 * DESIGN SYSTEM UPDATES:
 * - border-slate-100 → border-border (semantic border color)
 * - border-zinc-950 → border-primary (active tab indicator)
 * - text-zinc-400 → text-text-secondary (inactive tab text)
 * - Applied consistent spacing using design system tokens
 * - Used semantic color names for better maintainability
 * 
 * PRIMITIVE COMPONENTS USED:
 * - AccordionContainer from @/components/ui/primitives/Accordion
 *   (replaces boombox-10.0 AccordionContainer import)
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added ARIA role="tablist" for category navigation
 * - Added ARIA role="tab" for each category button
 * - Added aria-selected state for active category
 * - Added keyboard navigation support (arrow keys)
 * - Added aria-label for the FAQ region
 * - Maintained tabindex for proper keyboard focus flow
 * - Added aria-controls to link tabs with content
 * 
 * @refactor Refactored with design system compliance, enhanced accessibility, and primitive component usage
 */

'use client';

import React, { useState } from 'react';
import { AccordionContainer } from '@/components/ui/primitives/Accordion';
import { faqs } from '@/data/faq';
import { cn } from '@/lib/utils';

/**
 * Available FAQ categories for filtering
 */
const categories = [
  'General',
  'Pricing',
  'Storage Access',
  'Labor',
  'Scheduling',
  'Security',
  'Delivery',
  'Other',
] as const;

type Category = typeof categories[number];

export interface FaqFilterProps {
  /**
   * Default category to display on mount
   * @default 'General'
   */
  defaultCategory?: Category;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Callback when category changes
   */
  onCategoryChange?: (category: Category) => void;
}

/**
 * FaqFilter Component
 * 
 * Displays a category filter for FAQ content with accordion-based display.
 * Implements WCAG 2.1 AA accessibility standards with proper tab navigation.
 */
export function FaqFilter({
  defaultCategory = 'General',
  className,
  onCategoryChange,
}: FaqFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(defaultCategory);

  // Filter FAQs based on the selected category
  const filteredFaqs = faqs.filter((faq) => faq.category === selectedCategory);

  // Handle category change with keyboard support
  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    onCategoryChange?.(category);
  };

  // Handle keyboard navigation for tabs
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const { key } = event;

    // Arrow key navigation
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      event.preventDefault();
      const nextIndex = key === 'ArrowRight' 
        ? (index + 1) % categories.length 
        : (index - 1 + categories.length) % categories.length;
      
      const nextCategory = categories[nextIndex];
      handleCategoryChange(nextCategory);
      
      // Focus the next button
      const buttons = document.querySelectorAll('[role="tab"]');
      (buttons[nextIndex] as HTMLElement)?.focus();
    }

    // Home/End key navigation
    if (key === 'Home') {
      event.preventDefault();
      handleCategoryChange(categories[0]);
      const buttons = document.querySelectorAll('[role="tab"]');
      (buttons[0] as HTMLElement)?.focus();
    }

    if (key === 'End') {
      event.preventDefault();
      const lastIndex = categories.length - 1;
      handleCategoryChange(categories[lastIndex]);
      const buttons = document.querySelectorAll('[role="tab"]');
      (buttons[lastIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <div 
      className={cn('flex-col lg:px-16 sm:mb-48 mb-24 px-6 min-h-[500px]', className)}
      aria-label="FAQ category filter and content"
    >
      {/* Categories Tab Navigation */}
      <div 
        className="w-full flex space-x-4 justify-start border-b border-border mb-6 text-nowrap overflow-x-auto scrollbar-hide whitespace-nowrap"
        role="tablist"
        aria-label="FAQ categories"
      >
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`faq-panel-${category.toLowerCase().replace(/\s+/g, '-')}`}
              tabIndex={isSelected ? 0 : -1}
              className={cn(
                'py-2 px-4 border-b-2',
                'hover:text-text-primary',
                isSelected
                  ? 'border-primary text-text-primary font-medium'
                  : 'border-transparent text-text-secondary'
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* FAQ List */}
      <div 
        className="w-full py-6 xl:px-12"
        role="tabpanel"
        id={`faq-panel-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`}
        aria-labelledby={`tab-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {filteredFaqs.length > 0 ? (
          <AccordionContainer 
            data={filteredFaqs}
            onAccordionChange={() => {}}
            defaultOpenIndex={null}
            ariaLabel={`${selectedCategory} FAQs`}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              No FAQs found for this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FaqFilter;

