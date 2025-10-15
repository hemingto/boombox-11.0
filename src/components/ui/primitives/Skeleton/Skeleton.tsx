/**
 * @fileoverview Skeleton components for content loading states
 * @source boombox-10.0/src/app/components/mover-account/contacttable.tsx (skeleton patterns)
 * @source boombox-10.0/src/app/admin/tasks/page.tsx (skeleton loading)
 * @source boombox-10.0/src/app/components/mover-account/jobhistory.tsx (skeleton patterns)
 * @refactor Consolidated skeleton loading patterns into reusable components
 */

import { cn } from '@/lib/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Skeleton content (for custom shapes)
   */
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        'bg-surface-tertiary rounded animate-pulse',
        'bg-shimmer bg-cover bg-no-repeat animate-shimmer',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

// Specific skeleton variants for common use cases
const SkeletonText: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <Skeleton className={cn('skeleton-text h-4', className)} {...props} />
);

const SkeletonTitle: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <Skeleton className={cn('skeleton-title h-6', className)} {...props} />
);

const SkeletonAvatar: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <Skeleton
    className={cn('skeleton-avatar w-10 h-10 rounded-full', className)}
    {...props}
  />
);

const SkeletonButton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <Skeleton className={cn('h-10 w-24 rounded-md', className)} {...props} />
);

const SkeletonCard: React.FC<SkeletonProps & { lines?: number }> = ({
  className,
  lines = 3,
  ...props
}) => (
  <Skeleton className={cn('card p-6', className)} {...props}>
    <SkeletonTitle className="mb-4 w-3/4" />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonText
        key={i}
        className={cn('mb-2', i === lines - 1 ? 'w-1/2' : 'w-full')}
      />
    ))}
  </Skeleton>
);

const SkeletonTable: React.FC<
  SkeletonProps & {
    rows?: number;
    columns?: number;
  }
> = ({ className, rows = 5, columns = 4, ...props }) => (
  <div className={cn('space-y-4', className)} {...props}>
    {/* Table header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonText key={`header-${i}`} className="flex-1 h-5" />
      ))}
    </div>

    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonText
            key={`cell-${rowIndex}-${colIndex}`}
            className="flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonList: React.FC<SkeletonProps & { items?: number }> = ({
  className,
  items = 3,
  ...props
}) => (
  <div className={cn('space-y-4', className)} {...props}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <SkeletonText className="w-3/4" />
          <SkeletonText className="w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
};
