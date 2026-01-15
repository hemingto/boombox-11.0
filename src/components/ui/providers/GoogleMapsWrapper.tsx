/**
 * @fileoverview A wrapper component to load the Google Maps API script.
 * @source boombox-10.0/src/app/components/reusablecomponents/googlemapswrapper.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * This component uses `@react-google-maps/api` to load the Google Maps script.
 * It ensures that the Google Maps API is available to its children components.
 * The component renders children immediately without blocking, allowing Google Maps
 * to load in the background without showing a loading spinner.
 *
 * API ROUTES UPDATED:
 * - Old: N/A -> New: N/A
 *
 * DESIGN SYSTEM UPDATES:
 * - Removed loading spinner to prevent blocking UI on page load
 * - Children now render immediately while Maps API loads in background
 *
 * @refactor Removed loading spinners to improve UX - pages load immediately
 * while Google Maps API loads asynchronously in the background.
 */

'use client'

import { ReactNode } from 'react';
import { LoadScript } from '@react-google-maps/api';

interface GoogleMapsWrapperProps {
  children: ReactNode;
}

export default function GoogleMapsWrapper({ children }: GoogleMapsWrapperProps) {
  const handleOnLoad = () => {
    console.log('Google Maps API loaded');
  };

  const handleError = () => {
    console.error('Error loading Google Maps API');
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      libraries={['places']}
      onLoad={handleOnLoad}
      onError={handleError}
      loadingElement={<div />}
    >
      {children}
    </LoadScript>
  );
}
