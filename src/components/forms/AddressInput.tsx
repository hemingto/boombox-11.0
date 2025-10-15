/**
 * @fileoverview Enhanced address input component with Google Places autocomplete
 * @source boombox-10.0/src/app/components/reusablecomponents/addressinputfield.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Google Places API autocomplete for California addresses
 * - Service area validation using zip code pricing data
 * - Real-time address suggestions with geographic bounds filtering
 * - Formatted address output with coordinates and city information
 * 
 * API ROUTES UPDATED:
 * - No API routes used (client-side Google Places API integration)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Integrated design system colors and utility classes
 * - Uses Input primitive component for consistent styling
 * - Applied accessibility standards with proper ARIA labels
 * - Error states use design system error colors and patterns
 * 
 * @refactor Migrated to use Input primitive component and design system integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPinIcon } from '@heroicons/react/20/solid';
import { Input } from '@/components/ui/primitives/Input';
import { cn } from '@/lib/utils/cn';
import { isInServiceArea } from '@/lib/utils/businessUtils';
import { useClickOutside } from '@/hooks/useClickOutside';

// Service area bounds for California
const CALIFORNIA_BOUNDS = {
  north: 42.009518,
  south: 32.528832,
  west: -124.482003,
  east: -114.131211,
} as const;

export interface AddressInputProps {
  /**
   * Callback when address selection is made
   */
  onAddressChange: (
    address: string,
    zipCode: string,
    coordinates: google.maps.LatLngLiteral,
    cityName: string
  ) => void;
  
  /**
   * Initial zip code value
   */
  initialZipCode?: string;
  
  /**
   * Whether the field has an error state
   */
  hasError?: boolean;
  
  /**
   * Callback to clear error state
   */
  onClearError?: () => void;
  
  /**
   * Current input value
   */
  value?: string;
  
  /**
   * Placeholder text for the input
   */
  placeholder?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  
  /**
   * Unique identifier for the input
   */
  id?: string;
  
  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string;
  
  /**
   * ARIA description for accessibility
   */
  'aria-describedby'?: string;
}

const AddressInput: React.FC<AddressInputProps> = ({
  onAddressChange,
  initialZipCode = '',
  hasError = false,
  onClearError,
  value = '',
  placeholder = 'Enter your delivery address',
  required = false,
  className,
  disabled = false,
  id = 'address-input',
  'aria-label': ariaLabel = 'Delivery address',
  'aria-describedby': ariaDescribedBy,
}) => {
  const [address, setAddress] = useState<string>(value);
  const [zipCode, setZipCode] = useState<string>(initialZipCode);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Refs for Google Maps services
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setAddress(value);
  }, [value]);

  // Sync initial zip code
  useEffect(() => {
    if (initialZipCode) {
      setZipCode(initialZipCode);
    }
  }, [initialZipCode]);

  // Handle clicking outside component
  useClickOutside(componentRef, () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setSuggestions([]);
    }, 150);
  });

  /**
   * Initialize Google Places services
   */
  const initializeServices = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      if (!autocompleteService.current) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!placesService.current) {
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      }
      return true;
    }
    return false;
  };

  /**
   * Handle input change and fetch address suggestions
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setAddress(inputValue);
    setIsFocused(true);
    setError(null);

    // Clear external error state
    if (onClearError) {
      onClearError();
    }

    // Get suggestions if input is long enough and Google Maps is available
    if (inputValue.length > 2 && initializeServices()) {
      setIsLoading(true);
      
      autocompleteService.current?.getPlacePredictions(
        {
          input: inputValue,
          bounds: CALIFORNIA_BOUNDS,
          componentRestrictions: { country: 'us' },
          types: ['address'],
        },
        (predictions, status) => {
          setIsLoading(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } else {
      setIsLoading(false);
      setSuggestions([]);
    }
  };

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (suggestion: google.maps.places.AutocompletePrediction) => {
    if (!initializeServices()) {
      setError('Unable to process address. Please try again.');
      return;
    }

    setIsLoading(true);
    
    placesService.current?.getDetails(
      { placeId: suggestion.place_id },
      (place, status) => {
        setIsLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && 
            place && 
            place.address_components) {
          
          const formattedAddress = formatAddress(place.address_components);
          setAddress(formattedAddress);

          // Extract zip code
          const zipCodeComponent = place.address_components.find(
            (component) => component.types.includes('postal_code')
          );
          const zipCodeValue = zipCodeComponent?.short_name || '';

          // Extract city name
          const cityComponent = place.address_components.find(
            (component) => 
              component.types.includes('locality') || 
              component.types.includes('sublocality')
          );
          const cityName = cityComponent?.long_name || '';

          // Validate service area using business logic
          const inServiceArea = isInServiceArea(zipCodeValue);
          
          if (!inServiceArea) {
            setError('Please enter an address within our service area');
            setSuggestions([]);
            return;
          }

          setZipCode(zipCodeValue);
          
          // Get coordinates
          const coordinates = {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          };

          // Notify parent component
          onAddressChange(formattedAddress, zipCodeValue, coordinates, cityName);
          
          setSuggestions([]);
        } else {
          setError('Failed to load address details. Please select another address.');
        }
      }
    );
  };

  /**
   * Format address components into a readable string
   */
  const formatAddress = (components: google.maps.GeocoderAddressComponent[]): string => {
    const street = components.find(c => c.types.includes('street_number'))?.long_name || '';
    const route = components.find(c => c.types.includes('route'))?.long_name || '';
    const city = components.find(c => c.types.includes('locality'))?.long_name || '';
    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
    const zip = components.find(c => c.types.includes('postal_code'))?.short_name || '';
    
    return `${street} ${route}, ${city}, ${state} ${zip}`.trim();
  };

  /**
   * Handle focus events
   */
  const handleFocus = () => {
    setIsFocused(true);
    if (onClearError) {
      onClearError();
    }
  };

  /**
   * Handle blur events
   */
  const handleBlur = () => {
    setIsFocused(false);
  };

  const displayError = error || hasError;
  const shouldShowSuggestions = suggestions.length > 0 && isFocused && !isLoading;

  return (
    <div ref={componentRef} className={cn('relative w-full', className)}>
      {/* Main input field using Input primitive */}
      <div className="relative">
        <Input
          id={id}
          type="text"
          name="address"
          value={address}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          error={displayError ? (error || 'Please enter a valid address') : undefined}
          icon={<MapPinIcon className="w-5 h-5" />}
          iconPosition="left"
          fullWidth
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={displayError ? 'true' : 'false'}
          aria-expanded={shouldShowSuggestions ? 'true' : 'false'}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-text-secondary border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Address suggestions dropdown */}
      {shouldShowSuggestions && (
        <div 
          className="absolute z-50 w-full mt-1 bg-surface-primary border border-border rounded-md shadow-custom-shadow"
          role="listbox"
          aria-label="Address suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="px-3 py-2 hover:bg-surface-secondary cursor-pointer flex items-center transition-colors duration-150 border-b border-border last:border-b-0"
              role="option"
              aria-selected="false"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSuggestionSelect(suggestion);
                }
              }}
            >
              <MapPinIcon className="w-4 h-4 mr-3 text-text-secondary flex-shrink-0" />
              <span className="text-sm text-text-primary truncate">
                {suggestion.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
