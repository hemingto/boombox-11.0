/**
 * @fileoverview Service provider route group layout - base layout for drivers and movers
 * @source boombox-10.0/src/app/driver-account-page/[id]/layout.tsx
 * @source boombox-10.0/src/app/mover-account-page/[id]/layout.tsx
 * @refactor Consolidated base layout for all service providers
 */

export default function ServiceProviderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

