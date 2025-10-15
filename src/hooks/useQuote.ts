/**
 * @fileoverview Custom hook for quote state management and calculations
 * @source boombox-10.0/src/app/components/getquote/myquote.tsx (state management)
 * @source boombox-10.0/src/app/components/getquote/mobilemyquote.tsx (state management)
 * @refactor Extracted quote state logic from MyQuote components
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { InsuranceOption } from '@/types/insurance';
import { calculateQuotePricing, PricingCalculation } from '@/lib/utils/pricingUtils';

interface UseQuoteParams {
  zipCode: string;
  storageUnitCount?: number;
  selectedInsurance?: InsuranceOption | null;
  loadingHelpPrice: string;
  accessStorageUnitCount?: number;
  isAccessStorage: boolean;
  coordinates: google.maps.LatLngLiteral | null;
  onCalculateTotal?: (total: number) => void;
  setMonthlyStorageRate: (rate: number) => void;
  setMonthlyInsuranceRate: (rate: number) => void;
}

interface UseQuoteReturn {
  // Mobile state
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  contentHeight: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
  
  // Map state
  mapCenter: google.maps.LatLngLiteral | null;
  mapZoom: number;
  
  // Pricing calculations
  pricing: PricingCalculation;
}

export function useQuote(params: UseQuoteParams): UseQuoteReturn {
  const {
    zipCode,
    storageUnitCount = 1,
    selectedInsurance,
    loadingHelpPrice,
    accessStorageUnitCount = 0,
    isAccessStorage,
    coordinates,
    onCalculateTotal,
    setMonthlyStorageRate,
    setMonthlyInsuranceRate,
  } = params;

  // Mobile state
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Map state
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(10);

  // Set map center and zoom when coordinates change
  useEffect(() => {
    if (coordinates) {
      setMapCenter(coordinates);
      setMapZoom(14);
    }
  }, [coordinates]);

  // Update mobile content height dynamically when expanded
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);

  // Calculate pricing
  const pricing = useMemo(() => {
    return calculateQuotePricing({
      zipCode,
      storageUnitCount,
      selectedInsurance,
      loadingHelpPrice,
      accessStorageUnitCount,
      isAccessStorage,
    });
  }, [
    zipCode,
    storageUnitCount,
    selectedInsurance,
    loadingHelpPrice,
    accessStorageUnitCount,
    isAccessStorage,
  ]);

  // Update parent component with total calculation
  useEffect(() => {
    if (onCalculateTotal) {
      onCalculateTotal(pricing.total);
    }
  }, [pricing.total, onCalculateTotal]);

  // Update monthly storage rate when pricing changes
  useEffect(() => {
    setMonthlyStorageRate(pricing.monthlyStorageRate);
  }, [pricing.monthlyStorageRate, setMonthlyStorageRate]);

  // Update monthly insurance rate when pricing changes
  useEffect(() => {
    setMonthlyInsuranceRate(pricing.insuranceRate / (storageUnitCount || 1)); // Base rate per unit
  }, [pricing.insuranceRate, storageUnitCount, setMonthlyInsuranceRate]);

  return {
    // Mobile state
    isExpanded,
    setIsExpanded,
    contentHeight,
    contentRef,
    
    // Map state
    mapCenter,
    mapZoom,
    
    // Pricing calculations
    pricing,
  };
}
