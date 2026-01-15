/**
 * @fileoverview Navigation utilities for routing and URL generation
 * @source boombox-11.0/src/components/ui/navigation/MenuPopover.tsx (getAccountPageUrl function)
 * @refactor Extracted navigation logic from components to centralized utility
 */

/**
 * Account types supported by the application
 */
export type AccountType = 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';

/**
 * User session interface for navigation
 */
export interface NavigationUser {
  id: string;
  accountType: AccountType;
}

/**
 * Get the appropriate account page URL based on user account type
 * @param user - User session data with id and accountType
 * @returns URL string for the user's account page
 * 
 * @example
 * ```ts
 * const user = { id: '123', accountType: 'USER' as const };
 * const url = getAccountPageUrl(user); // Returns '/customer/123'
 * ```
 */
export function getAccountPageUrl(user?: NavigationUser | null): string {
  // Check if user exists AND has required properties (not just null values)
  if (!user || !user.id || !user.accountType) return '/login';
  
  const { id: userId, accountType } = user;
  
  switch (accountType) {
    case 'USER':
      return `/customer/${userId}`;
    case 'DRIVER':
      return `/service-provider/driver/${userId}`;
    case 'MOVER':
      return `/service-provider/mover/${userId}`;
    case 'ADMIN':
      return `/admin`;
    default:
      return '/login';
  }
}

/**
 * Get the account page display text based on user session
 * @param user - User session data
 * @returns Display text for account page link
 */
export function getAccountPageText(user?: NavigationUser | null): string {
  // Check if user exists AND has required properties (not just null values)
  return (user && user.id && user.accountType) ? 'Account Page' : 'Log In';
}
