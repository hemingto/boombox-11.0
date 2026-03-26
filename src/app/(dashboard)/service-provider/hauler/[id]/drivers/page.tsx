'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';
import { Input } from '@/components/ui/primitives/Input';

interface DriverData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isApproved: boolean;
  status: string;
  isActive: boolean;
}

interface InvitationData {
  id: number;
  email: string;
  status: string;
  expiresAt: string;
}

export default function HaulerDriversPage() {
  const params = useParams();
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      const [driversRes, invitesRes] = await Promise.all([
        fetch(`/api/hauling-partners/${params.id}/drivers`),
        fetch(`/api/hauling-partners/${params.id}/driver-invites`),
      ]);

      if (driversRes.ok) {
        const data = await driversRes.json();
        setDrivers(data.drivers || []);
      }
      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch(
        `/api/hauling-partners/${params.id}/invite-driver`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail }),
        }
      );

      if (res.ok) {
        setInviteSuccess('Invitation sent successfully!');
        setInviteEmail('');
        fetchData();
      } else {
        const data = await res.json();
        setInviteError(data.error || 'Failed to send invitation');
      }
    } catch {
      setInviteError('An unexpected error occurred');
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-tertiary rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">Drivers</h1>

      <div className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Invite a Driver
        </h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Enter driver's email or phone"
              fullWidth
              aria-label="Driver email or phone"
            />
          </div>
          <Button variant="primary" onClick={handleInvite} loading={isInviting}>
            Send Invite
          </Button>
        </div>
        {inviteError && (
          <p className="text-sm text-status-error mt-2">{inviteError}</p>
        )}
        {inviteSuccess && (
          <p className="text-sm text-green-600 mt-2">{inviteSuccess}</p>
        )}
      </div>

      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Pending Invitations
          </h2>
          <div className="space-y-3">
            {invitations
              .filter(i => i.status === 'pending')
              .map(inv => (
                <div
                  key={inv.id}
                  className="bg-surface-primary rounded-lg p-4 shadow-custom-shadow flex justify-between items-center"
                >
                  <div>
                    <p className="text-text-primary">{inv.email}</p>
                    <p className="text-xs text-text-secondary">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Your Drivers
        </h2>
        {drivers.length === 0 ? (
          <div className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow text-center">
            <p className="text-text-secondary">
              No drivers yet. Send an invitation to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map(driver => (
              <div
                key={driver.id}
                className="bg-surface-primary rounded-lg p-4 shadow-custom-shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <p className="text-sm text-text-secondary">{driver.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    driver.isApproved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {driver.isApproved ? 'Approved' : driver.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
