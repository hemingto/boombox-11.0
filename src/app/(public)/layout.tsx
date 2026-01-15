/**
 * @fileoverview Public pages layout with navigation and footer
 * @source Created for boombox-11.0 public route group
 * @refactor Shared layout for all public marketing pages
 * @refactor Updated to conditionally render NavHeader vs MinimalNavbar based on page type
 * @refactor Updated to conditionally render Footer based on page type (e.g., hidden on get-quote)
 */

import { ConditionalNavbar } from '@/components/ui/navigation/ConditionalNavbar';
import { ConditionalFooter } from '@/components/ui/navigation/ConditionalFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConditionalNavbar />
      <main>{children}</main>
      <ConditionalFooter />
    </>
  );
}

