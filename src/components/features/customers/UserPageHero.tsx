/**
 * @fileoverview UserPageHero component - Welcome header for user dashboard
 * @source boombox-10.0/src/app/components/user-page/userpagehero.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 */

'use client';

export interface UserPageHeroProps {
  firstName: string;
}

/**
 * UserPageHero - Welcome header for user dashboard page
 * 
 * Features:
 * - Personalized greeting with user's first name
 * - Descriptive subtitle for page functionality
 * - Responsive spacing
 */
export const UserPageHero: React.FC<UserPageHeroProps> = ({ firstName }) => {
  return (
    <div className="flex flex-col mt-12 sm:mt-24 sm:mb-10 mb-8 lg:px-16 px-6 max-w-5xl w-full mx-auto">
      <h1 className="text-4xl font-semibold text-text-primary">
        Hi {firstName},
      </h1>
      <p className="mt-4 text-text-primary">
        You can manage upcoming appointments and your stored items from this page
      </p>
    </div>
  );
};

