/**
 * @fileoverview Unified Header component with all navigation variants
 * @source boombox-10.0/src/app/components/navbar/navheader.tsx
 * @source boombox-10.0/src/app/components/navbar/minimalnavbar.tsx
 * @source boombox-10.0/src/app/components/navbar/usernavbar.tsx
 * @source boombox-10.0/src/app/components/navbar/movernavbar.tsx
 * @refactor Consolidated 4 separate navbar components into unified Header with variants
 */

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/primitives/Button';

// These will be imported from the icons directory during Phase 5
// For now, using placeholder types
type IconComponent = React.ComponentType<{ className?: string }>;

export interface HeaderProps {
  /**
   * Header variant determines the navigation structure
   */
  variant?: 'full' | 'minimal' | 'user' | 'mover' | 'admin';

  /**
   * Visual theme
   */
  theme?: 'dark' | 'light';

  /**
   * User ID for user-specific navigation
   */
  userId?: string;

  /**
   * User type for mover navigation
   */
  userType?: 'driver' | 'mover';

  /**
   * Show/hide specific buttons
   */
  showGetQuoteButton?: boolean;
  showLoginButton?: boolean;
  showAddStorageButton?: boolean;
  showAccessStorageButton?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Logo component (will be imported from icons)
   */
  logo?: IconComponent;

  /**
   * Custom navigation items for admin variant
   */
  customNavItems?: Array<{
    label: string;
    href: string;
    icon?: IconComponent;
  }>;
}

// Placeholder for BoomboxLogo - will be imported during Phase 5
const BoomboxLogoPlaceholder: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn('bg-current rounded', className)}
    style={{ width: '128px', height: '32px' }}
  >
    <span className="sr-only">Boombox Storage</span>
  </div>
);

const Header: React.FC<HeaderProps> = ({
  variant = 'full',
  theme = 'dark',
  userId,
  userType = 'driver',
  showGetQuoteButton = true,
  showLoginButton = true,
  showAddStorageButton = true,
  showAccessStorageButton = true,
  className,
  logo: LogoComponent = BoomboxLogoPlaceholder,
  customNavItems = [],
}) => {
  const isDarkTheme = theme === 'dark';

  // Base navigation styles
  const navClasses = cn('h-16 w-full flex items-center', {
    'bg-zinc-950': isDarkTheme,
    'bg-white border-b border-slate-100': !isDarkTheme,
  });

  const logoClasses = cn('w-24 sm:w-32', {
    'text-white': isDarkTheme,
    'text-zinc-950': !isDarkTheme,
  });

  // Get home URL based on variant and userId
  const getHomeUrl = () => {
    switch (variant) {
      case 'user':
        return userId ? `/user-page/${userId}` : '/';
      case 'mover':
        return userId ? `/${userType}-account-page/${userId}` : '/';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  // Navigation items for full variant
  const fullNavItems = [
    { label: 'How it works', href: '/howitworks' },
    // Note: PricingPopover and LocationsPopover will be implemented during Phase 5
    // For now, using simple links
    { label: 'Pricing', href: '/storage-unit-prices' },
    { label: 'Locations', href: '/locations' },
  ];

  // User-specific navigation items (for future Phase 5 implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userNavItems = userId
    ? [
        { label: 'Home', href: `/user-page/${userId}` },
        { label: 'Add storage unit', href: `/user-page/${userId}/add-storage` },
        {
          label: 'Access storage',
          href: `/user-page/${userId}/access-storage`,
        },
        {
          label: 'Packing supplies',
          href: `/user-page/${userId}/packing-supplies`,
        },
        { label: 'Payments', href: `/user-page/${userId}/payments` },
        { label: 'Account info', href: `/user-page/${userId}/account-info` },
      ]
    : [];

  // Mover-specific navigation items (for future Phase 5 implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const moverNavItems = userId
    ? [
        { label: 'Home', href: `/${userType}-account-page/${userId}` },
        {
          label: 'Calendar',
          href: `/${userType}-account-page/${userId}/calendar`,
        },
        {
          label: 'Coverage area',
          href: `/${userType}-account-page/${userId}/coverage-area`,
        },
        {
          label: 'Account information',
          href: `/${userType}-account-page/${userId}/account-information`,
        },
        {
          label: 'Payment',
          href: `/${userType}-account-page/${userId}/payment`,
        },
        {
          label: 'Best practices',
          href: `/${userType}-account-page/${userId}/best-practices`,
        },
      ]
    : [];

  const renderNavItems = () => {
    switch (variant) {
      case 'full':
        return (
          <ul className="hidden lg:flex lg:gap-10 md:gap-6 basis-1/3 grow justify-center">
            {fullNavItems.map(item => (
              <li
                key={item.href}
                className="text-sm rounded-full py-2.5 px-3 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
              >
                <Link
                  href={item.href}
                  className="text-white text-nowrap text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {/* Placeholder for Pricing and Locations popovers - will be implemented in Phase 5 */}
          </ul>
        );
      case 'admin':
        return customNavItems.length > 0 ? (
          <ul className="hidden lg:flex lg:gap-6 basis-1/3 grow justify-center">
            {customNavItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    isDarkTheme
                      ? 'text-white hover:bg-zinc-800'
                      : 'text-zinc-950 hover:bg-slate-100'
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null;
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    const buttonVariant = isDarkTheme ? 'secondary' : 'primary';
    const ghostVariant = isDarkTheme ? 'ghost' : 'outline';

    switch (variant) {
      case 'full':
        return (
          <ul className="md:basis-1/3 flex justify-end items-center grow gap-4">
            {showGetQuoteButton && (
              <li>
                <Link href="/getquote">
                  <Button
                    variant={buttonVariant}
                    size="sm"
                    className="hidden sm:block"
                  >
                    Get Quote
                  </Button>
                </Link>
              </li>
            )}
            {/* Placeholder for MenuPopover and MobileMenu - will be implemented in Phase 5 */}
            <li>
              <div className="w-10 h-10 bg-current opacity-20 rounded-full" />
            </li>
          </ul>
        );

      case 'minimal':
        return (
          <ul className="md:basis-1/2 flex justify-end items-center grow gap-3">
            {showLoginButton && (
              <li>
                <Link href="/login">
                  <Button
                    variant={ghostVariant}
                    size="sm"
                    className="hidden sm:block"
                  >
                    Log in
                  </Button>
                </Link>
              </li>
            )}
            {showGetQuoteButton && (
              <li>
                <Link href="/getquote">
                  <Button
                    variant={buttonVariant}
                    size="sm"
                    className="hidden sm:block"
                  >
                    Get Quote
                  </Button>
                </Link>
              </li>
            )}
            {/* Placeholder for menu - will be implemented in Phase 5 */}
            <li>
              <div className="w-10 h-10 bg-current opacity-20 rounded-full" />
            </li>
          </ul>
        );

      case 'user':
        return (
          <ul className="md:basis-1/2 flex justify-end items-center grow gap-3">
            {showAccessStorageButton && (
              <li>
                <Link href={`/user-page/${userId}/access-storage`}>
                  <Button
                    variant={ghostVariant}
                    size="sm"
                    className="hidden sm:block"
                  >
                    Access Storage
                  </Button>
                </Link>
              </li>
            )}
            {showAddStorageButton && (
              <li>
                <Link href={`/user-page/${userId}/add-storage`}>
                  <Button
                    variant={buttonVariant}
                    size="sm"
                    className="hidden sm:block"
                  >
                    Add Storage
                  </Button>
                </Link>
              </li>
            )}
            {/* Placeholder for user menu - will be implemented in Phase 5 */}
            <li>
              <div className="w-10 h-10 bg-current opacity-20 rounded-full" />
            </li>
          </ul>
        );

      case 'mover':
        return (
          <ul className="md:basis-1/2 flex justify-end items-center grow gap-3">
            {/* Placeholder for notification bell - will be implemented in Phase 5 */}
            <li>
              <div className="w-8 h-8 bg-current opacity-20 rounded-full" />
            </li>
            {/* Placeholder for mover menu - will be implemented in Phase 5 */}
            <li>
              <div className="w-10 h-10 bg-current opacity-20 rounded-full" />
            </li>
          </ul>
        );

      case 'admin':
        return (
          <ul className="md:basis-1/3 flex justify-end items-center grow gap-3">
            {/* Placeholder for admin controls - will be implemented in Phase 5 */}
            <li>
              <div className="w-10 h-10 bg-current opacity-20 rounded-full" />
            </li>
          </ul>
        );

      default:
        return null;
    }
  };

  return (
    <header className={className}>
      <nav className={navClasses}>
        <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
          {/* Logo section */}
          <ul
            className={cn(
              'justify-start',
              variant === 'full' ? 'md:basis-1/3' : 'md:basis-1/2'
            )}
          >
            <li>
              <Link href={getHomeUrl()}>
                <LogoComponent className={logoClasses} />
              </Link>
            </li>
          </ul>

          {/* Navigation items (only for full and admin variants) */}
          {renderNavItems()}

          {/* Action buttons */}
          {renderActionButtons()}
        </div>
      </nav>
    </header>
  );
};

export { Header };
