import type { Metadata } from 'next';
import { inter, poppins, fontVariables } from '@/lib/fonts';
import { SessionProvider, GoogleMapsWrapper } from '@/components/ui/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Full-Service Storage San Francisco | Boombox Storage',
  description: 'Looking for storage? San Francisco-based Boombox is a full-service storage company managing the pick up, storage, and retrieval of your things. ✓ Book today!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables}`}>
      <body className={`antialiased`}>
        <SessionProvider>
          <GoogleMapsWrapper>
            {children}
          </GoogleMapsWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
