/**
 * @fileoverview User context provider for customer dashboard
 * @source boombox-10.0/src/app/context/usercontext.tsx
 * @refactor Migrated to contexts directory with proper TypeScript types
 */

'use client';

import React, { createContext, useContext } from 'react';

const UserContext = createContext<string>('');

export function UserProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  return <UserContext.Provider value={userId}>{children}</UserContext.Provider>;
}

export const useUser = (): string => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

