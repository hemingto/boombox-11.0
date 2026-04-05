import type { Metadata, Viewport } from 'next';
import { inter, poppins, fontVariables } from '@/lib/fonts';
import { SessionProvider, GoogleMapsWrapper } from '@/components/ui/providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import './globals.css';

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Full-Service Storage San Francisco | Boombox Storage',
  description:
    'Looking for storage? San Francisco-based Boombox is a full-service storage company managing the pick up, storage, and retrieval of your things. ✓ Book today!',
  other: {
    'theme-color': '#09090b',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${fontVariables}`}>
      <body className={`antialiased`}>
        <SessionProvider session={session}>
          <GoogleMapsWrapper>{children}</GoogleMapsWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
