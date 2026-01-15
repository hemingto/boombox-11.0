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
import { Input } from '@/components/ui/primitives/Input/Input';
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
  
  // Validation state
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [messageType, setMessageType] = useState<MessageType>(null);
  
  const searchParams = useSearchParams();
  
  /**
   * Geocodes a zip code and centers the map on its location
   * Note: This function only updates the map center, not the validation state
   */
  const getCoordinatesForZip = async (zip: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Debug logging
    console.log('🗺️ Geocoding Debug:', {
      zip,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'
    });
    
    if (!apiKey) {
      console.warn('⚠️ Google Maps API key is not configured. Skipping geocoding.');
      return;
    }
    
    try {
      const url = `${GEOCODE_API_URL}?address=${zip}&key=${apiKey}`;
      console.log('📍 Fetching geocode for:', zip);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Geocode API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('✅ Geocoding successful, centering map at:', location);
        setMapCenter({ lat: location.lat, lng: location.lng });
        setMapZoom(12);
      } else {
        console.warn('⚠️ Geocoding failed:', data.status || 'No results found');
        if (data.error_message) {
          console.error('Error details:', data.error_message);
        }
      }
      // If geocoding fails, we don't override the validation state
      // The zip code validation already succeeded, we just can't center the map
    } catch (error) {
      // Silently fail - geocoding is a nice-to-have feature
      // The zip code validation already succeeded
      console.warn('❌ Geocoding error:', error);
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
      e.preventDefault(); // Prevent form submission if inside a form
      handleCheckZipCode();
    }
  };
  
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setZipCode(newValue);
    // Clear validation messages when user modifies input
    if (message || hasError || messageType) {
      handleClearError();
    }
  };
  
  const handleClearError = () => {
    setMessage(null);
    setHasError(false);
    setMessageType(null);
  };
  
  // Custom styling for success and error states with !important to override Input component styles
  const getInputClassName = () => {
    if (messageType === 'success') {
      return '!ring-status-success !ring-2 !bg-status-bg-success !border-status-success placeholder:!text-status-success !text-status-success';
    }
    if (messageType === 'error') {
      return '!ring-status-error !ring-2 !bg-status-bg-error !border-status-error';
    }
    return '';
  };
  
  // Polygon styling based on validation state
  const polygonOptions = messageType === 'success'
    ? {
        fillColor: 'rgb(16 185 129)', // status-success
        fillOpacity: 0.2,
        strokeColor: 'rgb(16 185 129)', // status-success
        strokeOpacity: 1,
        strokeWeight: 2,
      }
    : {
        fillColor: 'rgb(161 161 170)', // zinc-400 (text-secondary)
        fillOpacity: 0.2,
        strokeColor: 'rgb(63 63 70)', // zinc-700 (primary-active)
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
        
        <div className="mb-12">
          <Input
            id="zip-code-input"
            type="text"
            placeholder="Enter your zip"
            label="Check if your zip code is within our service area"
            value={zipCode}
            onChange={handleZipChange}
            onKeyDown={handleKeyDown}
            icon={<MapPinIcon className={cn('w-5 h-5', messageType === 'success' && 'text-status-success')} />}
            iconPosition="left"
            size="md"
            error={hasError && messageType === 'error' ? message || undefined : undefined}
            className={cn('max-w-80 placeholder:text-sm', getInputClassName())}
          />
          
          {/* Success message (not handled by Input primitive) */}
          {messageType === 'success' && message && (
            <p 
              className="text-sm font-medium text-status-success mt-2"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </div>
        
        <Button
          onClick={() => handleCheckZipCode(zipCode)}
          variant="primary"
          size="md"
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

