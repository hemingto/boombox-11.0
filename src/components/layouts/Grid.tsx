/**
 * @fileoverview Grid component for responsive grid layouts
 * @source boombox-10.0/src/app/components/reusablecomponents/footer.tsx (grid grid-cols-1 md:grid-cols-3 pattern)
 * @source boombox-10.0/src/app/components/locations/citiessection.tsx (grid patterns)
 * @source boombox-10.0/src/app/components/navbar/locationspopover.tsx (grid grid-cols-3 pattern)
 * @refactor Created reusable Grid component for consistent layout patterns
 */

import { cn } from '@/lib/utils/cn';

export interface GridProps {
  /**
   * Number of columns for different breakpoints
   */
  cols?: {
    default?: 1 | 2 | 3 | 4 | 5 | 6;
    sm?: 1 | 2 | 3 | 4 | 5 | 6;
    md?: 1 | 2 | 3 | 4 | 5 | 6;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };

  /**
   * Gap between grid items
   */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

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
  as?: 'div' | 'section' | 'article' | 'ul';
}

export interface GridItemProps {
  /**
   * Column span for different breakpoints
   */
  span?: {
    default?: 1 | 2 | 3 | 4 | 5 | 6;
    sm?: 1 | 2 | 3 | 4 | 5 | 6;
    md?: 1 | 2 | 3 | 4 | 5 | 6;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };

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
  as?: 'div' | 'article' | 'li';
}

const Grid: React.FC<GridProps> = ({
  cols = { default: 1, md: 3 }, // Default pattern from footer
  gap = 'lg',
  className,
  children,
  as: Component = 'div',
}) => {
  const gridClasses = cn(
    'grid',

    // Default columns
    {
      'grid-cols-1': cols.default === 1,
      'grid-cols-2': cols.default === 2,
      'grid-cols-3': cols.default === 3,
      'grid-cols-4': cols.default === 4,
      'grid-cols-5': cols.default === 5,
      'grid-cols-6': cols.default === 6,
    },

    // Small breakpoint columns
    cols.sm && {
      'sm:grid-cols-1': cols.sm === 1,
      'sm:grid-cols-2': cols.sm === 2,
      'sm:grid-cols-3': cols.sm === 3,
      'sm:grid-cols-4': cols.sm === 4,
      'sm:grid-cols-5': cols.sm === 5,
      'sm:grid-cols-6': cols.sm === 6,
    },

    // Medium breakpoint columns
    cols.md && {
      'md:grid-cols-1': cols.md === 1,
      'md:grid-cols-2': cols.md === 2,
      'md:grid-cols-3': cols.md === 3,
      'md:grid-cols-4': cols.md === 4,
      'md:grid-cols-5': cols.md === 5,
      'md:grid-cols-6': cols.md === 6,
    },

    // Large breakpoint columns
    cols.lg && {
      'lg:grid-cols-1': cols.lg === 1,
      'lg:grid-cols-2': cols.lg === 2,
      'lg:grid-cols-3': cols.lg === 3,
      'lg:grid-cols-4': cols.lg === 4,
      'lg:grid-cols-5': cols.lg === 5,
      'lg:grid-cols-6': cols.lg === 6,
    },

    // Extra large breakpoint columns
    cols.xl && {
      'xl:grid-cols-1': cols.xl === 1,
      'xl:grid-cols-2': cols.xl === 2,
      'xl:grid-cols-3': cols.xl === 3,
      'xl:grid-cols-4': cols.xl === 4,
      'xl:grid-cols-5': cols.xl === 5,
      'xl:grid-cols-6': cols.xl === 6,
    },

    // Gap variants (common patterns from boombox-10.0)
    {
      'gap-0': gap === 'none',
      'gap-4': gap === 'sm',
      'gap-6 sm:gap-8': gap === 'md',
      'gap-8': gap === 'lg',
      'gap-10 sm:gap-12': gap === 'xl',
    },

    className
  );

  return <Component className={gridClasses}>{children}</Component>;
};

const GridItem: React.FC<GridItemProps> = ({
  span,
  className,
  children,
  as: Component = 'div',
}) => {
  const itemClasses = cn(
    // Default column span
    span?.default && {
      'col-span-1': span.default === 1,
      'col-span-2': span.default === 2,
      'col-span-3': span.default === 3,
      'col-span-4': span.default === 4,
      'col-span-5': span.default === 5,
      'col-span-6': span.default === 6,
    },

    // Small breakpoint span
    span?.sm && {
      'sm:col-span-1': span.sm === 1,
      'sm:col-span-2': span.sm === 2,
      'sm:col-span-3': span.sm === 3,
      'sm:col-span-4': span.sm === 4,
      'sm:col-span-5': span.sm === 5,
      'sm:col-span-6': span.sm === 6,
    },

    // Medium breakpoint span
    span?.md && {
      'md:col-span-1': span.md === 1,
      'md:col-span-2': span.md === 2,
      'md:col-span-3': span.md === 3,
      'md:col-span-4': span.md === 4,
      'md:col-span-5': span.md === 5,
      'md:col-span-6': span.md === 6,
    },

    // Large breakpoint span
    span?.lg && {
      'lg:col-span-1': span.lg === 1,
      'lg:col-span-2': span.lg === 2,
      'lg:col-span-3': span.lg === 3,
      'lg:col-span-4': span.lg === 4,
      'lg:col-span-5': span.lg === 5,
      'lg:col-span-6': span.lg === 6,
    },

    // Extra large breakpoint span
    span?.xl && {
      'xl:col-span-1': span.xl === 1,
      'xl:col-span-2': span.xl === 2,
      'xl:col-span-3': span.xl === 3,
      'xl:col-span-4': span.xl === 4,
      'xl:col-span-5': span.xl === 5,
      'xl:col-span-6': span.xl === 6,
    },

    className
  );

  return <Component className={itemClasses}>{children}</Component>;
};

// Pre-configured grid patterns for common use cases

export interface FooterGridProps {
  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children: React.ReactNode;
}

const FooterGrid: React.FC<FooterGridProps> = ({ className, children }) => {
  return (
    <Grid cols={{ default: 1, md: 3 }} gap="lg" className={className}>
      {children}
    </Grid>
  );
};

export interface LocationsGridProps {
  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children: React.ReactNode;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  className,
  children,
}) => {
  return (
    <Grid cols={{ default: 3 }} gap="none" className={cn('p-4', className)}>
      {children}
    </Grid>
  );
};

export interface CardGridProps {
  /**
   * Number of columns for different breakpoints
   */
  cols?: {
    default?: 1 | 2 | 3 | 4;
    sm?: 1 | 2 | 3 | 4;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4;
    xl?: 1 | 2 | 3 | 4;
  };

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children: React.ReactNode;
}

const CardGrid: React.FC<CardGridProps> = ({
  cols = { default: 1, sm: 2, lg: 3 },
  className,
  children,
}) => {
  return (
    <Grid cols={cols} gap="md" className={className}>
      {children}
    </Grid>
  );
};

export { Grid, GridItem, FooterGrid, LocationsGrid, CardGrid };
