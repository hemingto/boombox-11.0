/**
 * @fileoverview Hero section component for moving partner signup page
 * @source boombox-10.0/src/app/components/mover-signup/moversignuphero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a hero section with an icon, customizable title, and description text
 * for the moving partner signup page. Provides visual branding and context for
 * new moving partners registering with the platform.
 * 
 * API ROUTES UPDATED:
 * - None (Pure UI component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic spacing classes (mt-12, sm:mt-24, lg:px-16, px-6)
 * - Used design system text hierarchy (text-text-primary for headings, text-text-secondary for descriptions)
 * - Consistent margin/padding patterns following design system spacing scale
 * 
 * @refactor Simplified component with design system compliance and proper TypeScript interfaces
 */

'use client';

import { MovingHelpIcon } from '@/components/icons/MovingHelpIcon';

export interface MoverSignUpHeroProps {
  /**
   * Main hero title text
   */
  title: string;
  
  /**
   * Hero description text
   */
  description: string;
}

/**
 * MoverSignUpHero component displays hero section for moving partner signup
 * 
 * @example
 * ```tsx
 * <MoverSignUpHero
 *   title="Join Our Moving Partner Network"
 *   description="Connect with customers and grow your business"
 * />
 * ```
 */
export function MoverSignUpHero({ title, description }: MoverSignUpHeroProps) {
  return (
    <div className="flex-col mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-12 mb-6 text-center">
      <div className="mb-8">
        <MovingHelpIcon className="w-20 mb-4 mx-auto text-primary" />
        <h1 className="mb-4 text-text-primary">{title}</h1>
        <p className="text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

export default MoverSignUpHero;

