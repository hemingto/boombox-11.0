/**
 * @fileoverview Route information map display component for hauling partners
 * Shows the hauling route on a Google Map with warehouse location markers
 * at Stockton and South San Francisco, with the driving route highlighted
 * between the two locations using the Directions API.
 *
 * COMPONENT FUNCTIONALITY:
 * - Displays interactive Google Map showing the hauling route
 * - Fetches driving directions between Stockton and SSF warehouses
 * - Renders the actual driving route on the map with custom styling
 * - Displays warehouse location markers at both endpoints
 * - Shows informational notes about warehouse locations and hauling logistics
 * - Uses custom map styling for better visual presentation
 */

'use client';

import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { mapStyles } from '@/app/mapstyles';
import { WAREHOUSE_ADDRESS } from '@/lib/utils/onfleetTaskUtils';

const STOCKTON_WAREHOUSE_ADDRESS = '4233 Coronada Ave, Stockton, CA';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.375rem',
};

export interface RouteInformationContentProps {
  userId?: string;
}

export const RouteInformationContent: React.FC<
  RouteInformationContentProps
> = ({ userId }) => {
  const [directionsResult, setDirectionsResult] =
    useState<google.maps.DirectionsResult | null>(null);
  const [stocktonLocation, setStocktonLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [ssfLocation, setSsfLocation] =
    useState<google.maps.LatLngLiteral | null>(null);

  const [mapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 37.8,
    lng: -121.85,
  });
  const [mapZoom] = useState(9);

  useEffect(() => {
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: STOCKTON_WAREHOUSE_ADDRESS,
        destination: WAREHOUSE_ADDRESS,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirectionsResult(result);

          const route = result.routes[0];
          if (route?.legs[0]) {
            const leg = route.legs[0];
            setStocktonLocation({
              lat: leg.start_location.lat(),
              lng: leg.start_location.lng(),
            });
            setSsfLocation({
              lat: leg.end_location.lat(),
              lng: leg.end_location.lng(),
            });
          }
        }
      }
    );
  }, []);

  return (
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-96 sm:mb-60">
      {/* Map Container */}
      <div className="bg-surface-tertiary w-full aspect-video rounded-md">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={mapZoom}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
          }}
        >
          {/* Driving route between warehouses */}
          {directionsResult && (
            <DirectionsRenderer
              directions={directionsResult}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#2563eb',
                  strokeOpacity: 0.8,
                  strokeWeight: 5,
                },
              }}
            />
          )}

          {/* Stockton Warehouse Marker */}
          {stocktonLocation && (
            <Marker
              position={stocktonLocation}
              title="Stockton Warehouse — 4233 Coronada Ave, Stockton, CA"
            />
          )}

          {/* SSF Warehouse Marker */}
          {ssfLocation && (
            <Marker
              position={ssfLocation}
              title={`South San Francisco Warehouse — ${WAREHOUSE_ADDRESS}`}
            />
          )}
        </GoogleMap>
      </div>

      {/* Warehouse Locations Note */}
      <div
        className="mt-4 p-3 border border-border rounded-md"
        role="note"
        aria-label="Warehouse locations information"
      >
        <p className="text-sm text-text-primary">
          <strong className="font-semibold">Note:</strong> The markers represent
          the Boombox warehouse locations at{' '}
          <span className="font-bold">{STOCKTON_WAREHOUSE_ADDRESS}</span> and{' '}
          <span className="font-bold">{WAREHOUSE_ADDRESS}</span>. The
          highlighted route shows the driving path between the two warehouses.
        </p>
      </div>

      {/* Route Details Section */}
      <section aria-labelledby="route-info-heading">
        <h2
          id="route-info-heading"
          className="text-2xl font-semibold text-text-primary mt-10 mb-4"
        >
          Route Details
        </h2>

        <ul className="space-y-2" role="list">
          <li className="text-text-primary">
            <span className="mr-2">•</span>
            The hauling route runs between the Stockton warehouse at{' '}
            <span className="font-bold">{STOCKTON_WAREHOUSE_ADDRESS}</span> and
            the South San Francisco warehouse at{' '}
            <span className="font-bold">{WAREHOUSE_ADDRESS}</span>.
          </li>
          <li className="text-text-primary">
            <span className="mr-2">•</span>
            Hauling jobs follow this route between the two warehouse locations.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default RouteInformationContent;
