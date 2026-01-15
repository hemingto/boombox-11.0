/**
 * @fileoverview Auth pages layout with minimal navigation
 * @source Created for boombox-11.0 auth route group
 * @refactor Shared layout for all authentication pages
 * 
 * NOTE: Admin login page (/admin/login) hides the navbar for cleaner UX
 */

'use client';

import { MinimalNavbar } from '@/components/ui/navigation/MinimalNavbar';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbar = pathname?.startsWith('/admin');
  
  return (
    <>
      {!hideNavbar && <MinimalNavbar theme="light" showGetQuoteButton={false} />}
      <main>{children}</main>
    </>
  );
}

