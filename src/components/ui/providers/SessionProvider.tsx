/**
 * @fileoverview NextAuth SessionProvider wrapper component
 * @source boombox-10.0/src/app/components/providers/SessionProvider.tsx
 * @refactor Moved to centralized providers directory in design system
 * 
 * USAGE:
 * This component wraps the NextAuth SessionProvider to bridge the Server/Client
 * component boundary in Next.js 15 App Router. It should be used once in the
 * root layout to provide session context to the entire application.
 * 
 * All components and hooks using NextAuth (useSession, signIn, signOut) must
 * be descendants of this provider in the component tree.
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

/**
 * Client-side wrapper for NextAuth SessionProvider
 * 
 * This component is marked as 'use client' to enable React Context usage
 * while allowing the root layout to remain a Server Component.
 * 
 * @param children - Child components that will have access to session context
 * @param session - Optional session object from server (getServerSession)
 */
export default function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      session={session} 
      refetchOnWindowFocus={false}
      refetchInterval={5 * 60} // Check session every 5 minutes
    >
      {children}
    </NextAuthSessionProvider>
  );
}

