/**
 * @fileoverview A wrapper component to load the Google Maps API script.
 * @source boombox-10.0/src/app/components/reusablecomponents/googlemapswrapper.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * This component uses `@react-google-maps/api` to load the Google Maps script.
 * It ensures that the Google Maps API is available to its children components.
 *
 * API ROUTES UPDATED:
 * - Old: N/A -> New: N/A
 *
 * DESIGN SYSTEM UPDATES:
 * - N/A
 *
 * @refactor The component is refactored to be a client component and to handle the API key more robustly.
 * The state management for loading is kept as it is part of the component's core logic.
 * Replaced the empty div for the loading element with the `Spinner` primitive.
 */

'use client'

import { ReactNode, useState } from 'react';
import { LoadScript } from '@react-google-maps/api';
import { Spinner } from '@/components/ui/primitives';

interface GoogleMapsWrapperProps {
  children: ReactNode;
}

export default function GoogleMapsWrapper({ children }: GoogleMapsWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleOnLoad = () => {
    console.log('Google Maps API loaded');
    setIsLoaded(true);
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
      loadingElement={<Spinner />}
    >
      {isLoaded ? children : <Spinner />}
    </LoadScript>
  );
}
