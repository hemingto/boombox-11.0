'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';

interface VehicleData {
  id: number;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vehicleCategory: string | null;
  vehicleType: string | null;
  unitCapacity: number | null;
  frontVehiclePhoto: string | null;
  backVehiclePhoto: string | null;
  interiorPhoto: string | null;
  autoInsurancePhoto: string | null;
  isApproved: boolean;
}

export default function HaulerVehiclePage() {
  const params = useParams();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [showTrailerForm, setShowTrailerForm] = useState(false);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await fetch(`/api/hauling-partners/${params.id}/vehicle`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchVehicles();
  }, [params.id]);

  const trucks = vehicles.filter(v => v.vehicleCategory === 'truck');
  const trailers = vehicles.filter(v => v.vehicleCategory === 'trailer');

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
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        Truck & Trailer
      </h1>

      <div className="space-y-8">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Truck</h2>
            {trucks.length === 0 && (
              <Button variant="primary" onClick={() => setShowTruckForm(true)}>
                Add Truck
              </Button>
            )}
          </div>
          {trucks.length === 0 && !showTruckForm ? (
            <div className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow text-center">
              <p className="text-text-secondary">
                No truck added yet. Add your truck to continue your application.
              </p>
            </div>
          ) : (
            trucks.map(truck => (
              <div
                key={truck.id}
                className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {truck.year} {truck.make} {truck.model}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Type: {truck.vehicleType || 'N/A'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Plate: {truck.licensePlate}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${truck.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {truck.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Trailer</h2>
            {trailers.length === 0 && (
              <Button
                variant="primary"
                onClick={() => setShowTrailerForm(true)}
              >
                Add Trailer
              </Button>
            )}
          </div>
          {trailers.length === 0 && !showTrailerForm ? (
            <div className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow text-center">
              <p className="text-text-secondary">
                No trailer added yet. Add your trailer to continue your
                application.
              </p>
            </div>
          ) : (
            trailers.map(trailer => (
              <div
                key={trailer.id}
                className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {trailer.vehicleType || 'Trailer'}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Capacity: {trailer.unitCapacity || 'N/A'} units
                    </p>
                    <p className="text-sm text-text-secondary">
                      Plate: {trailer.licensePlate}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${trailer.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {trailer.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
