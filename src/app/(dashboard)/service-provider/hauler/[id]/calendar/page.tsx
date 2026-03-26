'use client';

import { useParams } from 'next/navigation';

export default function HaulerCalendarPage() {
  const params = useParams();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        Work Schedule
      </h1>
      <div className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow">
        <p className="text-text-secondary">
          Availability management for hauling partner {params.id}.
        </p>
        <p className="text-sm text-text-secondary mt-2">
          Manage your weekly availability for haul jobs here.
        </p>
      </div>
    </div>
  );
}
