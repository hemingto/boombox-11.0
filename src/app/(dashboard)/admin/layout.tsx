/**
 * @fileoverview Admin dashboard layout with sidebar navigation
 * @source boombox-10.0/src/app/admin/layout.tsx
 * @refactor Migrated to (dashboard)/admin route group, moved auth detection to auth route group
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  HomeIcon,
  CalendarDaysIcon,
  TruckIcon,
  UserGroupIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ListBulletIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  NumberedListIcon,
  UserCircleIcon,
  CircleStackIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { BoomboxLogo } from '@/components/icons/BoomboxLogo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Tasks', href: '/admin/tasks', icon: NumberedListIcon },
    { name: 'Jobs', href: '/admin/jobs', icon: ListBulletIcon },
    { name: 'Delivery Routes', href: '/admin/delivery-routes', icon: MapIcon },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarDaysIcon },
    { name: 'Drivers', href: '/admin/drivers', icon: IdentificationIcon },
    { name: 'Movers', href: '/admin/movers', icon: UserGroupIcon },
    { name: 'Vehicles', href: '/admin/vehicles', icon: TruckIcon },
    { name: 'Customers', href: '/admin/customers', icon: UserCircleIcon },
    { name: 'Storage Units', href: '/admin/storage-units', icon: CubeIcon },
    { name: 'Inventory', href: '/admin/inventory', icon: ClipboardDocumentListIcon },
    { name: 'Feedback', href: '/admin/feedback', icon: ChatBubbleLeftRightIcon },
    { name: 'Ask Database', href: '/admin/ask-database', icon: CircleStackIcon },
    // Only show admin invites link for SUPERADMIN
    ...(session?.user?.role === 'SUPERADMIN' ? [
      { name: 'Admin Invites', href: '/admin/invites', icon: EnvelopeIcon },
    ] : []),
  ];

  return (
    <div>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold text-gray-900">Dashboard</div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar panel */}
        <div
          className={`fixed inset-0 flex transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            {/* Close button */}
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <BoomboxLogo className="w-32" />
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                              pathname === item.href
                                ? 'bg-gray-50 text-indigo-600'
                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                            }`}
                          >
                            <item.icon
                              className={`h-6 w-6 shrink-0 ${
                                pathname === item.href
                                  ? 'text-indigo-600'
                                  : 'text-gray-400 group-hover:text-indigo-600'
                              }`}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <div className="w-48 text-sm text-gray-500 mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {session?.user?.email}
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/admin/login' })}
                      className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    >
                      <ArrowRightOnRectangleIcon
                        className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                        aria-hidden="true"
                      />
                      Sign Out
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <BoomboxLogo className="w-32" />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          pathname === item.href
                            ? 'bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            pathname === item.href
                              ? 'text-indigo-600'
                              : 'text-gray-400 group-hover:text-indigo-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="w-48 text-sm text-gray-500 mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  {session?.user?.email}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/admin/login' })}
                  className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                >
                  <ArrowRightOnRectangleIcon
                    className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                    aria-hidden="true"
                  />
                  Sign Out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <main>
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}

