/**
 * @fileoverview NextAuth.js configuration with custom providers and callbacks
 * @source boombox-10.0/src/app/lib/auth.ts
 * @refactor Moved to auth directory with NO LOGIC CHANGES
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/database/prismaClient';
import CredentialsProvider from 'next-auth/providers/credentials';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';

// Define valid account types
type AccountType = 'customer' | 'driver' | 'mover' | 'admin';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        contact: { label: 'Email or Phone', type: 'text' },
        accountType: { label: 'Account Type', type: 'text' },
        code: { label: 'Verification Code', type: 'text' },
        skipVerification: { label: 'Skip Verification', type: 'boolean' },
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.contact || !credentials?.accountType) {
          throw new Error('Missing credentials');
        }

        const { contact, accountType, code, skipVerification, userId } =
          credentials;

        // Validate account type
        if (!['customer', 'driver', 'mover', 'admin'].includes(accountType)) {
          throw new Error('Invalid account type');
        }

        // Normalize contact if it's a phone number (contains digits)
        const normalizedContact = /\d/.test(contact)
          ? normalizePhoneNumberToE164(contact)
          : contact;

        // If not skipping verification, verify the code
        if (!skipVerification) {
          console.log('Verifying code:', { contact: normalizedContact, code });
          const verificationCode = await prisma.verificationCode.findFirst({
            where: {
              contact: normalizedContact,
              code: code.toString(),
              expiresAt: {
                gt: new Date(),
              },
            },
          });

          console.log('Found verification code:', verificationCode);

          if (!verificationCode) {
            throw new Error('Invalid or expired verification code');
          }

          // Delete the used verification code
          await prisma.verificationCode.delete({
            where: { id: verificationCode.id },
          });
        }

        // Find account by userId if provided (for direct login)
        let account = null;
        if (userId) {
          if (accountType === 'customer') {
            account = await prisma.user.findUnique({
              where: { id: parseInt(userId) },
            });
          } else if (accountType === 'driver') {
            account = await prisma.driver.findUnique({
              where: { id: parseInt(userId) },
            });
          } else if (accountType === 'mover') {
            account = await prisma.movingPartner.findUnique({
              where: { id: parseInt(userId) },
            });
          } else if (accountType === 'admin') {
            account = await prisma.admin.findUnique({
              where: { id: parseInt(userId) },
              select: {
                id: true,
                email: true,
                phoneNumber: true,
                role: true,
              },
            });
          }
        } else {
          // Otherwise find by contact info
          if (accountType === 'customer') {
            account = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: normalizedContact },
                  { phoneNumber: normalizedContact },
                ],
              },
            });
          } else if (accountType === 'driver') {
            account = await prisma.driver.findFirst({
              where: {
                OR: [
                  { email: normalizedContact },
                  { phoneNumber: normalizedContact },
                ],
              },
            });
          } else if (accountType === 'mover') {
            account = await prisma.movingPartner.findFirst({
              where: {
                OR: [
                  { email: normalizedContact },
                  { phoneNumber: normalizedContact },
                ],
              },
            });
          } else if (accountType === 'admin') {
            account = await prisma.admin.findFirst({
              where: {
                OR: [
                  { email: normalizedContact },
                  { phoneNumber: normalizedContact },
                ],
              },
              select: {
                id: true,
                email: true,
                phoneNumber: true,
                role: true,
              },
            });
          }
        }

        if (!account) {
          throw new Error(`No ${accountType} account found`);
        }

        // Return the account info with role for admin users
        const user = {
          id: account.id.toString(),
          email: account.email || '',
          name:
            accountType === 'mover'
              ? account.name
              : accountType === 'admin'
                ? account.email
                : `${account.firstName} ${account.lastName}`,
          accountType: accountType as AccountType,
          role: accountType === 'admin' ? account.role : undefined,
        };

        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: '/login',
    signOut: '/api/auth/logout',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // When signing in, create a new session with current timestamp
        const customUser = user as any; // Type assertion for custom user properties
        token.id = customUser.id;
        token.accountType = customUser.accountType as AccountType;
        token.sessionCreated = Date.now();
        token.sessionId = crypto.randomUUID();
        if (customUser.role) {
          token.role = customUser.role;
          console.log('Setting role in token:', customUser.role);
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const customSession = session as any; // Type assertion for custom session properties
        const customUser = session.user as any; // Type assertion for custom user properties

        customUser.id = token.id as string;
        customUser.accountType = token.accountType as AccountType;
        customSession.created = token.sessionCreated as number;
        customSession.sessionId = token.sessionId as string;
        if (token.role) {
          customUser.role = token.role;
          console.log('Setting role in session:', token.role);
        }
      }
      return session;
    },
    async signIn() {
      // You could add additional checks here if needed
      return true;
    },
  },
};
