/**
 * @fileoverview Admin invites page for sending admin invitations (SUPERADMIN only)
 * @source boombox-10.0/src/app/admin/invites/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Allows SUPERADMIN to send admin invitations
 * - Role selection (Admin, SuperAdmin, Viewer)
 * - Email input with validation
 * - Redirects non-SUPERADMIN users
 * - Success/error messaging
 * 
 * API ROUTES USED:
 * - POST /api/admin/invites - Send admin invitation
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens for text and backgrounds
 * - Uses EmailInput component
 * - Uses btn-primary for submit button
 * - Replaced hardcoded colors with design system colors
 * 
 * @refactor Extracted from inline page implementation
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/16/solid';
import { CheckIcon } from '@heroicons/react/20/solid';
import { EmailInput } from '@/components/forms';

const roles = [
  { id: 'ADMIN', name: 'Admin' },
  { id: 'SUPERADMIN', name: 'Super Admin' },
  { id: 'VIEWER', name: 'Viewer' },
];

export function AdminInvitesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    email: '',
    role: roles[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not SUPERADMIN
  if (session?.user?.role !== 'SUPERADMIN') {
    router.push('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invite');
      }

      setSuccess('Invite sent successfully!');
      setFormData({ ...formData, email: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-surface-secondary">
      <div className="max-w-lg w-full h-full mt-12 sm:mt-24 space-y-8 bg-surface-primary rounded-3xl p-12 mx-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-text-primary">
            Send Admin Invites
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-md">
            <EmailInput
              hasError={!!error}
              errorMessage={error || ''}
              onEmailChange={(email) => setFormData({ ...formData, email })}
              onClearError={() => setError(null)}
              value={formData.email}
              placeholder="Enter email address to invite"
            />
          </div>

          <div>
            <div className="relative mt-2">
              <Listbox value={formData.role} onChange={(role) => setFormData({ ...formData, role })}>
                <Label className="form-label">Role</Label>
                <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-surface-primary py-1.5 pl-3 pr-2 text-left text-text-primary outline outline-1 -outline-offset-1 outline-border focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-border-focus sm:text-sm/6">
                  <span className="col-start-1 row-start-1 truncate pr-6">{formData.role.name}</span>
                  <ChevronUpDownIcon
                    aria-hidden="true"
                    className="col-start-1 row-start-1 size-5 self-center justify-self-end text-text-secondary sm:size-4"
                  />
                </ListboxButton>

                <ListboxOptions
                  transition
                  className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface-primary py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
                >
                  {roles.map((role) => (
                    <ListboxOption
                      key={role.id}
                      value={role}
                      className="group relative cursor-default select-none py-2 pl-3 pr-9 text-text-primary data-[focus]:bg-primary data-[focus]:text-text-inverse data-[focus]:outline-none"
                    >
                      <span className="block truncate font-normal group-data-[selected]:font-semibold">{role.name}</span>

                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary group-[&:not([data-selected])]:hidden group-data-[focus]:text-text-inverse">
                        <CheckIcon aria-hidden="true" className="size-5" />
                      </span>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            </div>
          </div>

          {error && (
            <div className="form-error text-center">{error}</div>
          )}

          {success && (
            <div className="text-status-success text-sm text-center">{success}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

