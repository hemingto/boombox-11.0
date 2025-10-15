/**
 * @fileoverview Login page - user authentication
 * @source boombox-10.0/src/app/login/page.tsx
 * @refactor Migrated to (auth) route group with proper SEO metadata
 */

import type { Metadata } from 'next';
import { LoginForm } from '@/components/features/auth';

export const metadata: Metadata = {
  title: 'Login | Boombox Storage',
  description: 'Sign in to your Boombox Storage account to manage your storage units, appointments, and payments.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LogIn() {
  return (
    <>
      <LoginForm />
    </>
  );
}

