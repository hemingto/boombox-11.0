/**
 * @fileoverview Container and Section components for consistent layout patterns
 * @source boombox-10.0/src/app/components/landingpage/whatfitssection.tsx (lg:px-16 px-6 pattern)
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (md:flex gap-x-8 lg:gap-x-16 pattern)
 * @source boombox-10.0/src/app/components/reusablecomponents/footer.tsx (max-w-7xl mx-auto pattern)
 * @refactor Consolidated container patterns into reusable layout components
 */

import { cn } from '@/lib/utils/cn';

export interface ContainerProps {
  /**
   * Container size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Whether to center the container
   */
  centered?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children: React.ReactNode;

  /**
   * HTML element type
   */
  as?: 'div' | 'main' | 'section' | 'article' | 'aside';
}

export interface SectionProps {
  /**
   * Section spacing variant
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Vertical padding variant
   */
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Background variant
   */
  background?: 'transparent' | 'white' | 'slate' | 'zinc';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children: React.ReactNode;

  /**
   * HTML element type
   */
  as?: 'div' | 'section' | 'article' | 'aside';
}

export interface FormContainerProps {
  /**
   * Whether to use the two-column layout pattern
   */
  twoColumn?: boolean;

  /**
   * Gap between columns
   */
  gap?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({
  size = 'lg',
  centered = true,
  className,
  children,
  as: Component = 'div',
}) => {
  const containerClasses = cn(
    // Base container styles
    'w-full',

    // Horizontal padding (standardized from boombox-10.0)
    'lg:px-16 px-6',

    // Max width variants
    {
      'max-w-2xl': size === 'sm',
      'max-w-4xl': size === 'md',
      'max-w-7xl': size === 'lg', // Most common pattern in boombox-10.0
      'max-w-none': size === 'xl',
      'w-full': size === 'full',
    },

    // Centering
    {
      'mx-auto': centered,
    },

    className
  );

  return <Component className={containerClasses}>{children}</Component>;
};

const Section: React.FC<SectionProps> = ({
  spacing = 'md',
  paddingY = 'md',
  background = 'transparent',
  className,
  children,
  as: Component = 'section',
}) => {
  const sectionClasses = cn(
    // Background variants
    {
      'bg-transparent': background === 'transparent',
      'bg-white': background === 'white',
      'bg-slate-100': background === 'slate',
      'bg-zinc-950': background === 'zinc',
    },

    // Vertical spacing (standardized from boombox-10.0 patterns)
    {
      // Bottom margin patterns found in boombox-10.0
      'mb-0': spacing === 'none',
      'mb-12 sm:mb-24': spacing === 'sm',
      'mb-24 sm:mb-48': spacing === 'md', // Most common pattern
      'mb-32 sm:mb-64': spacing === 'lg',
      'mb-48 sm:mb-96': spacing === 'xl',
    },

    // Vertical padding
    {
      'py-0': paddingY === 'none',
      'py-8 sm:py-12': paddingY === 'sm',
      'py-12 sm:py-24': paddingY === 'md',
      'py-24 sm:py-32': paddingY === 'lg',
      'py-32 sm:py-48': paddingY === 'xl',
    },

    className
  );

  return <Component className={sectionClasses}>{children}</Component>;
};

const FormContainer: React.FC<FormContainerProps> = ({
  twoColumn = false,
  gap = 'lg',
  className,
  children,
}) => {
  const formContainerClasses = cn(
    // Base form container pattern from getquote/access-storage forms
    {
      // Single column (default)
      'flex flex-col': !twoColumn,

      // Two column pattern (md:flex gap-x-8 lg:gap-x-16 from forms)
      'md:flex': twoColumn,
      'gap-x-4 lg:gap-x-8': twoColumn && gap === 'sm',
      'gap-x-8 lg:gap-x-16': twoColumn && (gap === 'md' || gap === 'lg'),
    },

    // Common form patterns
    'mt-12 sm:mt-24',
    'justify-center',
    'mb-10 sm:mb-64',
    'items-start',

    className
  );

  return <div className={formContainerClasses}>{children}</div>;
};

// Specialized containers for common patterns

export interface CardContainerProps {
  /**
   * Card background
   */
  background?: 'white' | 'slate';

  /**
   * Whether to include shadow
   */
  shadow?: boolean;

  /**
   * Padding variant
   */
  padding?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({
  background = 'white',
  shadow = true,
  padding = 'lg',
  className,
  children,
}) => {
  const cardClasses = cn(
    // Base card styles
    'rounded-md',

    // Background
    {
      'bg-white': background === 'white',
      'bg-slate-100': background === 'slate',
    },

    // Shadow (from driver signup form and other cards)
    {
      'shadow-custom-shadow': shadow,
    },

    // Padding variants (from form patterns)
    {
      'p-4 sm:p-6': padding === 'sm',
      'p-6 sm:p-8': padding === 'md',
      'p-6 sm:p-10': padding === 'lg', // Common pattern in signup forms
    },

    className
  );

  return <div className={cardClasses}>{children}</div>;
};

// Two-column layout component (common pattern for content + sidebar)
export interface TwoColumnLayoutProps {
  /**
   * Main content
   */
  main: React.ReactNode;

  /**
   * Sidebar content
   */
  sidebar: React.ReactNode;

  /**
   * Main content width ratio
   */
  mainWidth?: 'half' | 'two-thirds' | 'three-quarters';

  /**
   * Gap between columns
   */
  gap?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  main,
  sidebar,
  mainWidth = 'two-thirds',
  gap = 'lg',
  className,
}) => {
  const layoutClasses = cn(
    'flex flex-col sm:flex-row',

    // Gap variants
    {
      'gap-6 sm:gap-8': gap === 'sm',
      'gap-8 sm:gap-12': gap === 'md',
      'gap-8 sm:gap-12 lg:gap-20': gap === 'lg', // Pattern from blog-post/fullblogpost.tsx
    },

    className
  );

  const mainClasses = cn({
    'sm:basis-1/2': mainWidth === 'half',
    'sm:basis-2/3': mainWidth === 'two-thirds',
    'sm:basis-3/4': mainWidth === 'three-quarters',
  });

  const sidebarClasses = cn('w-full sm:ml-auto', {
    'sm:basis-1/2': mainWidth === 'half',
    'sm:basis-1/3 sm:max-w-[300px]': mainWidth === 'two-thirds', // Pattern from blog
    'sm:basis-1/4': mainWidth === 'three-quarters',
  });

  return (
    <div className={layoutClasses}>
      <div className={mainClasses}>{main}</div>
      <div className={sidebarClasses}>{sidebar}</div>
    </div>
  );
};

export { Container, Section, FormContainer, CardContainer, TwoColumnLayout };
