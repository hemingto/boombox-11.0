/**
 * @fileoverview Customer packing supplies page - order supplies as logged-in user
 * @source boombox-10.0/src/app/user-page/[id]/packing-supplies/page.tsx
 * @refactor Migrated to (dashboard)/customer route group with Stripe Elements
 */

'use client';

import { PackingSuppliesLayout } from '@/components/features/packing-supplies';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/primitives/Spinner/Spinner';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface SavedCard {
  id: number;
  stripePaymentMethodId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  savedCards: SavedCard[];
}

export default function PackingSupplies() {
  const params = useParams();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/customers/${userId}/profile`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Elements stripe={stripePromise}>
        <PackingSuppliesLayout userData={userData} />
      </Elements>
    </>
  );
}

