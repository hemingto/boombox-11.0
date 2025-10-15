/**
 * @fileoverview Spinner component for loading states
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (spinner patterns)
 * @source boombox-10.0/src/app/driver/offer/[token]/page.tsx (loading spinner)
 * @source boombox-10.0/src/app/components/mover-signup/moversignupform.tsx (loading overlay)
 * @refactor Consolidated spinner patterns into reusable component with variants
 */

import { cn } from '@/lib/utils/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size variant
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Color variant
   */
  variant?: 'primary' | 'secondary' | 'white' | 'current';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Accessible label for screen readers
   */
  label?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading...',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-16 h-16',
  };

  const variantClasses = {
    primary: 'border-zinc-950 border-t-transparent',
    secondary: 'border-zinc-400 border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent',
  };

  const borderWidth = {
    xs: 'border',
    sm: 'border',
    md: 'border-2',
    lg: 'border-2',
    xl: 'border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        borderWidth[size],
        className
      )}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};

export { Spinner };
