/**
 * @fileoverview Coverage area map display component for service providers
 * Shows the Boombox service area on a Google Map with warehouse location marker
 * and service area polygon overlay
 * 
 * @source boombox-10.0/src/app/components/mover-account/coverageareacontent.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays interactive Google Map centered on Bay Area service region
 * - Renders service area polygon overlay showing coverage boundaries
 * - Geocodes and displays warehouse location marker
 * - Shows informational notes about warehouse location and job logistics
 * - Uses custom map styling for better visual presentation
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic color tokens for borders and backgrounds
 * - Updated text colors to use design system hierarchy
 * - Replaced hardcoded colors with semantic tokens
 * - Improved spacing and layout consistency
 * 
 * @refactor 
 * - Applied comprehensive design system colors
 * - Enhanced component documentation
 * - Improved TypeScript types for Google Maps integration
 * - Better semantic HTML structure
 */

'use client';

import { GoogleMap, Polygon, Marker } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { mapStyles } from '@/app/mapstyles';
import { bayAreaCoordinates } from '@/data/bayareaserviceareacoordinates';
import { WAREHOUSE_ADDRESS } from '@/lib/utils/onfleetTaskUtils';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.375rem',
};

const serviceAreaStyles: google.maps.PolygonOptions = {
  fillColor: '#a1a1aa', // zinc-400 - neutral fill color for service area
  fillOpacity: 0.2,
  strokeColor: '#3f3f46', // zinc-700 - darker border for visibility
  strokeOpacity: 1,
  strokeWeight: 2,
};

export const CoverageAreaContent: React.FC = () => {
  const [mapCenter] = useState<google.maps.LatLngLiteral>({ 
    lat: 37.59, 
    lng: -122.1 
  });
  const [mapZoom] = useState(8.5);
  const [warehouseLocation, setWarehouseLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // Geocode the warehouse address to get coordinates for marker
  useEffect(() => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: WAREHOUSE_ADDRESS }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setWarehouseLocation({
          lat: location.lat(),
          lng: location.lng()
        });
      }
    });
  }, []);

  return (
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-10">
      {/* Map Container */}
      <div className="bg-surface-tertiary w-full aspect-video rounded-md">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={mapZoom}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,  // Keeps the zoom control visible
            fullscreenControl: false, // Disable the fullscreen control
            mapTypeControl: false,    // Disable map type (e.g., satellite)
            streetViewControl: false, // Disable the yellow Street View person icon
          }}
        >
          {/* Service Area Polygon */}
          <Polygon
            paths={bayAreaCoordinates}
            options={serviceAreaStyles}
          />
          
          {/* Warehouse Location Marker */}
          {warehouseLocation && (
            <Marker
              position={warehouseLocation}
              title="Boombox Warehouse"
            />
          )}
        </GoogleMap>
      </div>

      {/* Warehouse Location Note */}
      <div 
        className="mt-4 p-3 border border-border rounded-md max-w-fit"
        role="note"
        aria-label="Warehouse location information"
      >
        <p className="text-sm text-text-primary">
          <strong className="font-semibold">Note:</strong> The pin represents the Boombox warehouse location at{' '}
          <span className="font-bold">{WAREHOUSE_ADDRESS}</span>.
        </p>
      </div>

      {/* Service Area Information */}
      <section aria-labelledby="service-area-heading">
        <h2 
          id="service-area-heading"
          className="text-2xl font-semibold text-text-primary mt-10 mb-4"
        >
          Service Area Notes
        </h2>
        
        <ul className="space-y-2" role="list">
          <li className="text-text-primary">
            <span className="mr-2">•</span>
            The Boombox warehouse is located at{' '}
            <span className="font-bold">{WAREHOUSE_ADDRESS}.</span>
          </li>
          <li className="text-text-primary">
            <span className="mr-2">•</span>
            Jobs begin and end at the Boombox warehouse.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default CoverageAreaContent;

