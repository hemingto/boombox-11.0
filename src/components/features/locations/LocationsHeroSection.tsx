/**
 * @fileoverview Locations hero section with interactive map and zip code checker
 * @source boombox-10.0/src/app/components/locations/locationsherosection.tsx
 * @location src/components/features/locations/
 * 
 * COMPONENT FUNCTIONALITY:
 * Interactive hero section for locations pages featuring:
 * - Zip code input with validation
 * - Google Maps integration showing service area
 * - Real-time feedback for valid/invalid zip codes
 * - Map centering on validated zip codes
 * - Geocoding API integration
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced inline button styles with design system Button component
 * - Updated input states with design system colors (emerald for success, error states)
 * - Applied consistent spacing and layout patterns
 * - Used semantic color tokens for map polygon styling
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Enhanced form labels and ARIA attributes
 * - Proper error message announcements
 * - Keyboard navigation support
 * - Descriptive button and input labels
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - useCallback for memoized event handlers
 * - Optimized re-renders with proper dependency arrays
 * 
 * @refactor Migrated with design system Button, enhanced accessibility, maintained Google Maps functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPinIcon } from '@heroicons/react/20/solid';
import { GoogleMap, Marker, Polygon } from '@react-google-maps/api';
import { MapIcon } from '@/components/icons/MapIcon';
import { Button } from '@/components/ui';
import { mapStyles } from '@/app/mapstyles';
import { zipCodePrices } from '@/data/zipcodeprices';
import { bayAreaCoordinates } from '@/data/bayareaserviceareacoordinates';
import { cn } from '@/lib/utils/cn';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.375rem',
};

const GEOCODE_API_URL = `https://maps.googleapis.com/maps/api/geocode/json`;

type MessageType = 'success' | 'error' | null;

export interface LocationsHeroSectionProps {
  /**
   * Initial map center coordinates
   * @default { lat: 37.59, lng: -122.1 }
   */
  initialCenter?: google.maps.LatLngLiteral;
  
  /**
   * Initial map zoom level
   * @default 8.5
   */
  initialZoom?: number;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Validates if a string is a valid 5-digit US zip code
 */
function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function LocationsHeroSection({
  initialCenter = { lat: 37.59, lng: -122.1 },
  initialZoom = 8.5,
  className,
}: LocationsHeroSectionProps = {}) {
  // Map state
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);
  
  // Input state
  const [zipCode, setZipCode] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [hasValue, setHasValue] = useState<boolean>(false);
  
  // Validation state
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [messageType, setMessageType] = useState<MessageType>(null);
  
  const searchParams = useSearchParams();
  
  /**
   * Geocodes a zip code and centers the map on its location
   */
  const getCoordinatesForZip = async (zip: string) => {
    try {
      const response = await fetch(
        `${GEOCODE_API_URL}?address=${zip}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setMapCenter({ lat: location.lat, lng: location.lng });
        setMapZoom(12);
      } else {
        setMessage('Unable to find location for the zip code.');
        setHasError(true);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error fetching location data.');
      setHasError(true);
      setMessageType('error');
    }
  };
  
  /**
   * Validates zip code and updates UI accordingly
   */
  const handleCheckZipCode = useCallback(
    (inputZipCode = zipCode) => {
      if (!isValidZipCode(inputZipCode)) {
        setMessage('Please enter a valid zip code');
        setHasError(true);
        setMessageType('error');
      } else if (zipCodePrices.hasOwnProperty(inputZipCode)) {
        setMessage('Zip code is in our service area!');
        setHasError(false);
        setMessageType('success');
        getCoordinatesForZip(inputZipCode);
      } else {
        setMessage('Sorry, this zip code is not in our service area.');
        setHasError(true);
        setMessageType('error');
      }
    },
    [zipCode]
  );
  
  // Handle zip code from URL query params
  useEffect(() => {
    const zipFromParams = searchParams?.get('zipCode');
    if (zipFromParams && /^\d{5}$/.test(zipFromParams)) {
      setZipCode(zipFromParams);
      handleCheckZipCode(zipFromParams);
    }
  }, [searchParams, handleCheckZipCode]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheckZipCode();
    }
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    setMessage(null);
    setHasError(false);
    setMessageType(null);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(e.target.value);
    setHasValue(e.target.value.length > 0);
    setMessage(null);
    setHasError(false);
    setMessageType(null);
  };
  
  // Dynamic input styling based on validation state
  const inputClassName = cn(
    'pl-8 py-2.5 px-3 min-w-80 mb-2 rounded-md focus:outline-none placeholder:text-sm cursor-pointer',
    {
      'ring-emerald-500 ring-2 bg-emerald-100 placeholder:text-emerald-500 text-emerald-500':
        messageType === 'success',
      'ring-red-500 ring-2 bg-red-100 placeholder:text-red-500 text-red-500':
        hasError && messageType === 'error',
      'bg-surface-tertiary focus:placeholder:text-text-primary focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary placeholder:text-text-secondary':
        !messageType,
    }
  );
  
  const mapPinIconClass = cn({
    'text-emerald-500': messageType === 'success',
    'text-red-500': hasError && messageType === 'error',
    'text-text-primary': (isFocused || hasValue) && !messageType,
    'text-text-secondary': !isFocused && !hasValue && !messageType,
  });
  
  // Polygon styling based on validation state
  const polygonOptions = messageType === 'success'
    ? {
        fillColor: '#10b981',
        fillOpacity: 0.2,
        strokeColor: '#10b981',
        strokeOpacity: 1,
        strokeWeight: 2,
      }
    : {
        fillColor: '#a1a1aa',
        fillOpacity: 0.2,
        strokeColor: '#3f3f46',
        strokeOpacity: 1,
        strokeWeight: 2,
      };
  
  return (
    <section 
      className={cn(
        'md:flex mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-48 mb-24',
        className
      )}
      aria-labelledby="locations-hero-title"
    >
      {/* Left column: Form */}
      <div className="place-content-center basis-2/5 mb-10">
        <MapIcon className="mb-4 w-12 h-12" aria-hidden="true" />
        
        <h1 id="locations-hero-title" className="mb-10">
          Locations
        </h1>
        
        <p className="mb-4">
          Check if your zip code is within our service area
        </p>
        
        <div className="relative mb-10">
          <label htmlFor="zip-code-input" className="sr-only">
            Enter your zip code
          </label>
          
          <input
            id="zip-code-input"
            className={inputClassName}
            type="text"
            placeholder="Enter your zip"
            value={zipCode}
            onChange={handleZipChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-describedby={message ? 'zip-validation-message' : undefined}
            aria-invalid={hasError}
          />
          
          <MapPinIcon 
            className={cn('absolute inset-y-3 left-2 w-5 h-5', mapPinIconClass)} 
            aria-hidden="true"
          />
          
          {message && (
            <p 
              id="zip-validation-message"
              className={cn('text-sm', {
                'text-emerald-500': messageType === 'success',
                'text-red-500': messageType === 'error',
              })}
              role={messageType === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </div>
        
        <Button
          onClick={() => handleCheckZipCode(zipCode)}
          variant="primary"
          size="lg"
          borderRadius="md"
          className="font-semibold"
        >
          Check Zip
        </Button>
      </div>
      
      {/* Right column: Map */}
      <div 
        className="flex place-content-end aspect-square md:aspect-auto basis-3/5"
        role="img"
        aria-label="Map showing Boombox service area in the San Francisco Bay Area"
      >
        <div className="bg-surface-tertiary w-full md:ml-8 rounded-md">
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
            {mapZoom > 8 && messageType === 'success' && (
              <Marker position={mapCenter} />
            )}
            <Polygon
              paths={bayAreaCoordinates}
              options={polygonOptions}
            />
          </GoogleMap>
        </div>
      </div>
    </section>
  );
}

