/**
 * @fileoverview CSS-based iPhone device frame component.
 *
 * COMPONENT FUNCTIONALITY:
 * Renders a realistic iPhone silhouette around its children (video, image, etc.).
 * Uses pure CSS/Tailwind — no external images or dependencies required.
 *
 * FEATURES:
 * - Dark outer shell with rounded corners and subtle shadow
 * - Dynamic Island indicator centered at the top
 * - Inner "screen" area with overflow hidden for media content
 * - Fully responsive — sizes to its parent container
 *
 * ACCESSIBILITY:
 * - The frame is purely decorative, so it uses aria-hidden on chrome elements
 * - Children (video/image) should carry their own accessibility attributes
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface IPhoneFrameProps {
  /**
   * Content to display inside the phone screen (video, image, etc.)
   */
  children: React.ReactNode;

  /**
   * Optional additional CSS classes for the outer frame container
   */
  className?: string;
}

/**
 * IPhoneFrame Component
 *
 * A pure CSS iPhone device frame that wraps media content to create
 * a realistic phone mockup appearance.
 *
 * @example
 * ```tsx
 * <IPhoneFrame>
 *   <video src="/demo.mp4" autoPlay muted loop playsInline />
 * </IPhoneFrame>
 * ```
 *
 * @example With custom sizing
 * ```tsx
 * <IPhoneFrame className="h-[500px]">
 *   <Image src="/screenshot.png" alt="App screenshot" fill />
 * </IPhoneFrame>
 * ```
 */
export function IPhoneFrame({ children, className }: IPhoneFrameProps) {
  return (
    <div
      className={cn(
        // Outer shell — dark bezel with iPhone-like proportions
        'relative bg-black rounded-[2.5rem] p-[6px] shadow-[0px_30px_60px_rgba(0,0,0,0.18),0px_10px_20px_rgba(0,0,0,0.08)]',
        // Aspect ratio matched to iPhone screen recording (1290x2560 ≈ 9:18)
        'aspect-[9/18]',
        className
      )}
    >
      {/* Screen area — fills the entire inner frame, edge to edge */}
      <div className="relative w-full h-full overflow-hidden rounded-[2.2rem] bg-slate-50">
        {children}

        {/* Home indicator — overlaid on top of content */}
        <div
          className="absolute bottom-[6px] left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
        >
          <div className="w-[96px] h-[4px] bg-white/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}
