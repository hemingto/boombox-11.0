import { BoomboxLogo } from '@/components/icons/BoomboxLogo';
import Link from 'next/link';
import { HaulerMenuPopover } from './HaulerMenuPopover';
import { HaulerMobileMenu } from './HaulerMobileMenu';
import { NotificationBell } from './NotificationBell';

interface HaulerNavbarProps {
  theme?: 'dark' | 'light';
  userId: string;
}

export const HaulerNavbar: React.FC<HaulerNavbarProps> = ({
  theme = 'dark',
  userId,
}) => {
  const isDarkTheme = theme === 'dark';
  const baseUrl = `/service-provider/hauler/${userId}`;

  return (
    <header role="banner">
      <nav
        className={`h-16 w-full flex items-center ${isDarkTheme ? 'bg-primary' : 'bg-surface-primary border-b border-border'}`}
        aria-label="Hauling partner account navigation"
      >
        <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
          <ul className="md:basis-1/2 justify-start">
            <li>
              <Link
                href={baseUrl}
                aria-label="Go to hauler dashboard home"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <BoomboxLogo
                  className={`w-24 sm:w-32 ${isDarkTheme ? 'text-text-inverse' : 'text-primary'}`}
                />
              </Link>
            </li>
          </ul>

          <ul className="md:basis-1/2 flex justify-end items-center grow gap-3">
            <li>
              <NotificationBell
                recipientId={parseInt(userId)}
                recipientType="HAULER"
                isDarkTheme={isDarkTheme}
              />
            </li>
            <li>
              <HaulerMenuPopover
                className="hidden sm:block"
                theme={theme}
                userId={userId}
              />
              <HaulerMobileMenu
                className="sm:hidden"
                theme={theme}
                userId={userId}
              />
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};
