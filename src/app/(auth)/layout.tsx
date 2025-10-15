/**
 * @fileoverview Auth pages layout with minimal navigation
 * @source Created for boombox-11.0 auth route group
 * @refactor Shared layout for all authentication pages
 */

import { MinimalNavbar } from '@/components/ui/navigation/MinimalNavbar';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MinimalNavbar theme="light" showGetQuoteButton={false} />
      <main>{children}</main>
    </>
  );
}

