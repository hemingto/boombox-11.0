/**
 * @fileoverview Optimized Image component with Next.js Image and performance defaults
 * Replaces bg-slate placeholder divs with proper images for better SEO and performance
 */

import Image, { type ImageProps } from 'next/image';
import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface OptimizedImageProps extends Omit<ImageProps, 'placeholder'> {
  /**
   * Fallback image URL if main image fails to load
   */
  fallbackSrc?: string;
  
  /**
   * Show loading skeleton while image loads
   */
  showSkeleton?: boolean;
  
  /**
   * Custom skeleton className
   */
  skeletonClassName?: string;
  
  /**
   * Aspect ratio for consistent sizing
   */
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'wide';
  
  /**
   * Optimized loading strategy
   */
  loading?: 'lazy' | 'eager';
  
  /**
   * Container className for styling wrapper
   */
  containerClassName?: string;
}

const ASPECT_RATIOS = {
  square: 'aspect-square',      // 1:1
  video: 'aspect-video',        // 16:9
  portrait: 'aspect-[3/4]',     // 3:4
  landscape: 'aspect-[4/3]',    // 4:3
  wide: 'aspect-[21/9]',        // 21:9
} as const;

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  function OptimizedImage(
    {
      src,
      alt,
      fallbackSrc,
      showSkeleton = true,
      skeletonClassName,
      aspectRatio,
      loading = 'lazy',
      containerClassName,
      className,
      onError,
      onLoad,
      quality = 85,
      ...props
    },
    ref
  ) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      setIsLoading(false);
      
      // Try fallback image if available
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        setIsLoading(true);
        return;
      }
      
      onError?.(e);
    };

    // Build container classes
    const containerClasses = cn(
      'relative overflow-hidden',
      aspectRatio && ASPECT_RATIOS[aspectRatio],
      containerClassName
    );

    // Build image classes
    const imageClasses = cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    );

    // Build skeleton classes
    const skeletonClasses = cn(
      'absolute inset-0 bg-surface-tertiary animate-shimmer',
      'flex items-center justify-center',
      skeletonClassName
    );

    return (
      <div className={containerClasses}>
        {/* Loading skeleton */}
        {showSkeleton && isLoading && (
          <div className={skeletonClasses}>
            <div className="w-8 h-8 bg-surface-disabled rounded animate-pulse" />
          </div>
        )}

        {/* Error state */}
        {hasError && !fallbackSrc && (
          <div className="absolute inset-0 bg-surface-secondary flex items-center justify-center">
            <div className="text-center text-text-tertiary">
              <div className="w-8 h-8 bg-surface-disabled rounded mx-auto mb-2" />
              <p className="text-xs">Image not available</p>
            </div>
          </div>
        )}

        {/* Optimized Image */}
        <Image
          ref={ref}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          quality={quality}
          className={imageClasses}
          // Performance optimizations
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          {...props}
        />
      </div>
    );
  }
);

/**
 * Optimized Image for hero sections with priority loading
 */
export function HeroImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      loading="eager"
      priority
      quality={90}
      aspectRatio={props.aspectRatio || 'wide'}
    />
  );
}

/**
 * Optimized Image for cards/thumbnails
 */
export function ThumbnailImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      loading="lazy"
      quality={80}
      aspectRatio={props.aspectRatio || 'square'}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

/**
 * Optimized Image for content/blog images
 */
export function ContentImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      loading="lazy"
      quality={85}
      aspectRatio={props.aspectRatio || 'landscape'}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
    />
  );
}

/**
 * Optimized Image for avatars/profile pictures
 */
export function AvatarImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      loading="lazy"
      quality={90}
      aspectRatio="square"
      containerClassName={cn('rounded-full', props.containerClassName)}
      sizes="(max-width: 768px) 64px, 128px"
    />
  );
} 