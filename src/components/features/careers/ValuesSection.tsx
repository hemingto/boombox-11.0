/**
 * @fileoverview Company values section component with design system integration
 * @source boombox-10.0/src/app/components/careers/valuessection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays Boombox company values in a dark section with icons and descriptions
 * Shows Safety, Professionalism, Delight the Customer, and Accountability values
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded bg-zinc-950 with bg-primary design token
 * - Used text-text-inverse for consistent text color on dark backgrounds
 * - Applied design system spacing patterns (section-spacing)
 * - Enhanced accessibility with proper ARIA labels and semantic HTML structure
 * - Improved typography hierarchy with consistent text sizing
 * 
 * @refactor Updated to use design system colors and semantic color tokens for better maintainability
 */

import { CheckCircleIcon } from "@heroicons/react/24/solid";

export interface Value {
  title: string;
  description: string;
}

export interface ValuesSectionProps {
  /**
   * Array of company values to display
   */
  values?: Value[];
  
  /**
   * Section title
   */
  title?: string;
  
  /**
   * Additional CSS classes for customization
   */
  className?: string;
}

const defaultValues: Value[] = [
  {
    title: "Safety",
    description:
      "Making sure you and our customer's items are safe is our top priority. Storage can be difficult work, and taking the necessary steps to take care of you and the customer's items is of utmost importance to us.",
  },
  {
    title: "Professionalism",
    description:
      "We take pride in what we do and it's important that's reflected in the way we interact with our customers and colleagues.",
  },
  {
    title: "Delight the Customer",
    description:
      "Our goal is to make the storage experience as seamless and simple as possible. We love it when a customer lets us know how easy our service was.",
  },
  {
    title: "Accountability",
    description:
      "We want to build trust in our community and make sure we always stand behind our work.",
  },
];

export function ValuesSection({ 
  values = defaultValues,
  title = "Boombox Values",
  className 
}: ValuesSectionProps) {
  return (
    <section 
      className="px-6 lg:px-16 bg-primary pt-24 pb-36 sm:mb-24 mb-12"
      role="region"
      aria-labelledby="values-heading"
    >
      <h1 
        id="values-heading"
        className="mb-10 font-bold text-text-inverse"
      >
        {title}
      </h1>
      
      <div className="space-y-8" role="list">
        {values.map((value, index) => (
          <div 
            key={index} 
            className="flex items-start space-x-4"
            role="listitem"
          >
            <CheckCircleIcon 
              className="flex-shrink-0 w-8 h-8 mt-1 text-text-inverse" 
              aria-hidden="true"
            />
            <div>
              <h2 className="mb-2 text-text-inverse font-semibold">
                {value.title}
              </h2>
              <p className="text-sm text-text-inverse opacity-90">
                {value.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ValuesSection;
