/**
 * @fileoverview Admin login page
 * @source boombox-10.0/src/app/admin/login/page.tsx
 * @refactor Migrated to (auth)/admin route group for proper layout separation
 * 
 * COMPONENT UPDATES:
 * - Uses dedicated AdminLoginForm component instead of customer LoginForm
 * - Admin-specific authentication flow with /api/admin/login endpoints
 * - Proper session handling for admin accounts
 * - Redirects to /admin dashboard upon successful login
 */

import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/features/auth';

export const metadata: Metadata = {
  title: 'Admin Login | Boombox Storage',
  description: 'Admin portal login for Boombox Storage management dashboard.',
  robots: 'noindex, nofollow', // Don't index admin pages
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}

