/**
 * @fileoverview Public pages layout with navigation and footer
 * @source Created for boombox-11.0 public route group
 * @refactor Shared layout for all public marketing pages
 */

import { NavHeader } from '@/components/ui/navigation/NavHeader';
import { Footer } from '@/components/ui/navigation/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavHeader />
      <main>{children}</main>
      <Footer />
    </>
  );
}

