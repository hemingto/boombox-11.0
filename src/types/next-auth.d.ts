/**
 * @fileoverview NextAuth type augmentation for custom user properties
 * @source boombox-10.0/types/next-auth.d.ts
 * @refactor Added proper type augmentation for custom session/user properties
 */

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      accountType: 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';
      role?: string;
      sessionCreated?: Date;
      sessionId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    accountType: 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';
    role?: string;
    sessionCreated?: Date;
    sessionId?: string;
  }

  interface JWT {
    id: string;
    email: string;
    name?: string;
    accountType: 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';
    role?: string;
    sessionCreated?: Date;
    sessionId?: string;
  }
}
