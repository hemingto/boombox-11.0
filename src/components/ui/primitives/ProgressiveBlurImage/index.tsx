import Image, { type ImageProps } from 'next/image';
import { type CSSProperties } from 'react';

type NextImageProps = Omit<ImageProps, 'style'>;

interface ProgressiveBlurImageProps extends NextImageProps {
  /** Blur radius in pixels applied to the top portion. Default 8. */
  blurPx?: number;
  /** Percentage (0–100) where the blurred and sharp copies crossfade. Default 40. */
  crossover?: number;
}

/**
 * Renders two copies of the same image — one blurred (top) and one sharp (bottom) —
 * with complementary CSS gradient masks so they crossfade seamlessly.
 *
 * Uses `filter: blur()` directly on the image (not `backdrop-filter`), so the
 * effect is baked into the layer and survives parent `transform: scale()` without
 * flicker or white-corner bleed.
 *
 * Place inside a `position: relative; overflow: hidden` parent.
 */
export function ProgressiveBlurImage({
  blurPx = 8,
  crossover = 40,
  className,
  ...imageProps
}: ProgressiveBlurImageProps) {
  const blurredStyle: CSSProperties = {
    filter: `blur(${blurPx}px)`,
    maskImage: `linear-gradient(to bottom, black 0%, transparent ${crossover}%)`,
    WebkitMaskImage: `linear-gradient(to bottom, black 0%, transparent ${crossover}%)`,
    transform: 'scale(1.08)',
    transformOrigin: 'top center',
  };

  const sharpStyle: CSSProperties = {
    maskImage: `linear-gradient(to bottom, transparent 0%, black ${crossover}%)`,
    WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black ${crossover}%)`,
  };

  return (
    <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
      <Image {...imageProps} className={className} style={blurredStyle} />
      <Image {...imageProps} className={className} style={sharpStyle} />
    </div>
  );
}
