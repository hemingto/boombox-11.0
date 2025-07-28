/**
 * @fileoverview Payment calculation service for drivers and moving partners
 * @source boombox-10.0/src/app/lib/driver-payments/calculator.ts
 * @refactor Moved to services directory with updated imports
 */

export const PAYMENT_STRUCTURE = {
  // BOOMBOX DELIVERY DRIVERS ONLY
  // Base fee: covers "show up" + minimal parking/search time.
  // In SF, a $40–$45 base means a 5- or 10-mile run still nets the driver something worthwhile.
  fixed: 45.00,

  // Per-mile: covers gas + wear-and-tear + insurance.
  // The IRS rate (2024) is $0.67/mile; bumping that to $0.75+ reflects the higher insurance and maintenance costs in the Bay.
  mileage: 0.75,

  // Drive-time: actual time behind the wheel. 
  // Paying $24–$26/hr (i.e. ~$0.40 per minute) ensures the driver's "wage" is above SF living-wage thresholds.
  // Here we've used $24/hr.
  driveTime: 24.00,

  // Service-time: minimal time for delivery/pickup (customer or moving partner loads)
  // Lower rate since Boombox drivers don't do the loading work
  serviceTime: 15.00
};

// Estimated service hours by appointment type for BOOMBOX DELIVERY DRIVERS
// (Reduced times since they don't load - just delivery/pickup)
const BOOMBOX_DRIVER_SERVICE_TIME_ESTIMATES = {
  'Initial Pickup': 1.5,      // Just pickup and transport
  'Access Storage': 1.0,     // Quick delivery
  'End Storage Term': 1.0,    // Pickup and transport
  'Additional Storage': 1.5   // Just pickup and transport
};

// Estimated loading time per unit for MOVING PARTNERS
// (Time to actually load items into storage units)
const MOVING_PARTNER_LOADING_TIME_PER_UNIT = {
  'Initial Pickup': 1.5,      // 1 hour per unit to load
  'Access Storage': 1.0,      // 30 min per unit for access
  'End Storage Term': 1.0,   // 45 min per unit to unload
  'Additional Storage': 1.5   // 1 hour per unit to load
};

// Warehouse address constant
const WAREHOUSE_ADDRESS = process.env.WAREHOUSE_ADDRESS || '2340 3rd St, San Francisco, CA 94107';

interface TravelMetrics {
  distanceMiles: number;
  durationMinutes: number;
}

interface PaymentBreakdown {
  fixed: number;
  mileage: number;
  driveTime: number;
  serviceTime: number;
  total: number;
  formattedEstimate: string;
  travelMetrics: TravelMetrics;
  workerType: 'boombox_driver' | 'moving_partner';
}

/**
 * Calculate travel distance and time using Google Maps APIs
 * Tries Routes API first, falls back to Distance Matrix API if needed
 */
async function calculateTravelMetrics(
  warehouseAddress: string, 
  customerAddress: string
): Promise<TravelMetrics> {
  try {
    // Check for either environment variable
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Neither NEXT_PUBLIC_GOOGLE_MAPS_API_KEY nor GOOGLE_MAPS_API_KEY set, using fallback estimates');
      return getFallbackEstimates();
    }

    // Try Routes API first (modern approach)
    try {
      return await tryRoutesAPI(warehouseAddress, customerAddress, apiKey);
    } catch (routesError: any) {
      console.warn('Routes API failed, falling back to Distance Matrix API:', routesError.message);
      
      // Fall back to Distance Matrix API
      return await tryDistanceMatrixAPI(warehouseAddress, customerAddress, apiKey);
    }

  } catch (error) {
    console.error('All Google Maps APIs failed, using fallback estimates:', error);
    return getFallbackEstimates();
  }
}

/**
 * Try the modern Routes API
 */
async function tryRoutesAPI(
  warehouseAddress: string,
  customerAddress: string, 
  apiKey: string
): Promise<TravelMetrics> {
  const requestBody = {
    origin: {
      address: warehouseAddress
    },
    destination: {
      address: customerAddress
    },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
    computeAlternativeRoutes: false,
    units: 'IMPERIAL'
  };

  console.log('Trying Routes API...');
  
  const response = await fetch(
    `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
      },
      body: JSON.stringify(requestBody)
    }
  );
  
  if (!response.ok) {
    throw new Error(`Routes API HTTP error! status: ${response.status} - ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Routes API response successful');
  
  if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`No routes found in Routes API response`);
  }
  
  const route = data.routes[0];
  
  if (!route.duration || !route.distanceMeters) {
    throw new Error(`Missing duration or distance in Routes API response`);
  }
  
  // Parse duration (format: "123s" or "123.456s")
  const durationSeconds = parseFloat(route.duration.replace('s', ''));
  const durationMinutes = durationSeconds / 60;
  
  // Convert meters to miles
  const distanceMiles = route.distanceMeters * 0.000621371;
  
  console.log(`Routes API success: ${distanceMiles.toFixed(2)} miles, ${durationMinutes.toFixed(2)} minutes`);
  
  return {
    distanceMiles,
    durationMinutes
  };
}

/**
 * Fall back to the older Distance Matrix API
 */
async function tryDistanceMatrixAPI(
  warehouseAddress: string,
  customerAddress: string,
  apiKey: string
): Promise<TravelMetrics> {
  console.log('Trying Distance Matrix API...');
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
    `origins=${encodeURIComponent(warehouseAddress)}&` +
    `destinations=${encodeURIComponent(customerAddress)}&` +
    `units=imperial&` +
    `mode=driving&` +
    `departure_time=now&` +
    `traffic_model=best_guess&` +
    `key=${apiKey}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Distance Matrix API HTTP error! status: ${response.status} - ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Distance Matrix API response successful');
  
  if (data.status !== 'OK') {
    throw new Error(`Distance Matrix API returned status: ${data.status}`);
  }
  
  const element = data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') {
    throw new Error(`Distance Matrix API element status: ${element?.status || 'UNKNOWN'}`);
  }
  
  const distanceMiles = element.distance.value * 0.000621371; // Convert meters to miles
  const durationMinutes = element.duration_in_traffic?.value / 60 || element.duration.value / 60; // Convert seconds to minutes
  
  console.log(`Distance Matrix API success: ${distanceMiles.toFixed(2)} miles, ${durationMinutes.toFixed(2)} minutes`);
  
  return {
    distanceMiles,
    durationMinutes
  };
}

/**
 * Get fallback estimates when all APIs fail
 */
function getFallbackEstimates(): TravelMetrics {
  const estimatedMiles = 10;
  const estimatedMinutes = 20;
  console.log(`Using fallback estimates: ${estimatedMiles} miles, ${estimatedMinutes} minutes`);
  return {
    distanceMiles: estimatedMiles,
    durationMinutes: estimatedMinutes
  };
}

/**
 * Calculate estimated payment for a Boombox Delivery Driver
 * Updated to use corrected step-specific logic
 */
export async function calculateBoomboxDriverPayment(
  customerAddress: string,
  appointmentType: string,
  estimatedServiceHours?: number
): Promise<PaymentBreakdown> {
  // Use the new total estimate function for accurate calculations
  return calculateTotalBoomboxDriverEstimate(customerAddress, appointmentType, estimatedServiceHours);
}

/**
 * Calculate estimated payment for a Moving Partner
 * Updated to use corrected step-specific logic
 */
export async function calculateMovingPartnerPayment(
  appointmentType: string,
  numberOfUnits: number,
  movingPartnerHourlyRate: number,
  estimatedServiceHours?: number
): Promise<PaymentBreakdown> {
  // Use the new total estimate function for accurate calculations  
  return calculateTotalMovingPartnerEstimate(appointmentType, numberOfUnits, movingPartnerHourlyRate, estimatedServiceHours);
}

/**
 * Calculate estimated driver payment (legacy function for backward compatibility)
 * Updated to use corrected step-specific logic - defaults to Boombox Driver payment structure
 */
export async function calculateDriverPayment(
  customerAddress: string,
  appointmentType: string,
  estimatedServiceHours?: number
): Promise<PaymentBreakdown> {
  return calculateTotalBoomboxDriverEstimate(customerAddress, appointmentType, estimatedServiceHours);
}

/**
 * Get a shortened address for SMS messages
 */
export function getShortAddress(fullAddress: string): string {
  // Take first part before comma (usually street address)
  const parts = fullAddress.split(',');
  const streetAddress = parts[0].trim();
  
  // If still too long, truncate and add ellipsis
  if (streetAddress.length > 25) {
    return streetAddress.substring(0, 22) + '...';
  }
  
  return streetAddress;
}

/**
 * Calculate step-specific cost for a single OnfleetTask
 */
export async function calculateStepSpecificCost(
  stepNumber: number,
  workerType: 'boombox_driver' | 'moving_partner',
  customerAddress: string,
  appointmentType: string,
  numberOfUnits: number = 1,
  movingPartnerHourlyRate: number = 25,
  estimatedServiceHours?: number
): Promise<number> {
  try {
    if (workerType === 'moving_partner') {
      // Moving partners only get paid for Step 2 (service time)
      if (stepNumber === 2) {
        let serviceHours: number;
        
        if (estimatedServiceHours) {
          serviceHours = estimatedServiceHours;
        } else {
          // Calculate based on number of units
          const timePerUnit = MOVING_PARTNER_LOADING_TIME_PER_UNIT[appointmentType as keyof typeof MOVING_PARTNER_LOADING_TIME_PER_UNIT] || 1.0;
          serviceHours = Math.max(1.0, numberOfUnits * timePerUnit); // 1-hour minimum
        }
        
        return serviceHours * movingPartnerHourlyRate;
      } else {
        // Steps 1 and 3 have no cost for moving partners
        return 0;
      }
    } else {
      // Boombox drivers
      switch (stepNumber) {
        case 1: {
          // Step 1: ONLY fixed fee - no mileage, no drive time
          return PAYMENT_STRUCTURE.fixed;
        }
        
        case 2: {
          // Step 2: Drive time (warehouse→customer) + Service time + Mileage
          const travelMetrics = await calculateTravelMetrics(WAREHOUSE_ADDRESS, customerAddress);
          
          // Estimated drive time for warehouse → customer
          const driveTimeCost = (travelMetrics.durationMinutes / 60) * PAYMENT_STRUCTURE.driveTime;
          
          // Service time
          const serviceHours = estimatedServiceHours || 
            BOOMBOX_DRIVER_SERVICE_TIME_ESTIMATES[appointmentType as keyof typeof BOOMBOX_DRIVER_SERVICE_TIME_ESTIMATES] || 
            0.5; // Default fallback
          const serviceTimeCost = serviceHours * PAYMENT_STRUCTURE.serviceTime;
          
          // Mileage cost for warehouse → customer
          const mileageCost = travelMetrics.distanceMiles * PAYMENT_STRUCTURE.mileage;
          
          return driveTimeCost + serviceTimeCost + mileageCost;
        }
        
        case 3: {
          // Step 3: Drive time (customer→warehouse) + Mileage  
          const travelMetrics = await calculateTravelMetrics(WAREHOUSE_ADDRESS, customerAddress);
          
          // Estimated drive time for customer → warehouse (same as warehouse → customer)
          const driveTimeCost = (travelMetrics.durationMinutes / 60) * PAYMENT_STRUCTURE.driveTime;
          
          // Mileage cost for customer → warehouse (same distance)
          const mileageCost = travelMetrics.distanceMiles * PAYMENT_STRUCTURE.mileage;
          
          return driveTimeCost + mileageCost;
        }
        
        default:
          console.warn(`Unknown step number for cost calculation: ${stepNumber}`);
          return 0;
      }
    }
  } catch (error) {
    console.error(`Error calculating step-specific cost for step ${stepNumber}:`, error);
    return 0; // Return 0 on error to prevent breaking the flow
  }
}

/**
 * Calculate total job estimate for Boombox Driver using corrected step-specific logic
 * Sums: Step 1 (fixed only) + Step 2 (drive + service + mileage) + Step 3 (drive + mileage)
 */
export async function calculateTotalBoomboxDriverEstimate(
  customerAddress: string,
  appointmentType: string,
  estimatedServiceHours?: number
): Promise<PaymentBreakdown> {
  try {
    // Calculate each step using the corrected logic
    const step1Cost = await calculateStepSpecificCost(1, 'boombox_driver', customerAddress, appointmentType, 1, 25, estimatedServiceHours);
    const step2Cost = await calculateStepSpecificCost(2, 'boombox_driver', customerAddress, appointmentType, 1, 25, estimatedServiceHours);
    const step3Cost = await calculateStepSpecificCost(3, 'boombox_driver', customerAddress, appointmentType, 1, 25, estimatedServiceHours);

    const totalCost = step1Cost + step2Cost + step3Cost;

    // Get travel metrics for tracking (from Step 2 calculation)
    const travelMetrics = await calculateTravelMetrics(WAREHOUSE_ADDRESS, customerAddress);

    // Service hours for tracking
    const serviceHours = estimatedServiceHours || 
      BOOMBOX_DRIVER_SERVICE_TIME_ESTIMATES[appointmentType as keyof typeof BOOMBOX_DRIVER_SERVICE_TIME_ESTIMATES] || 
      0.5;

    return {
      fixed: step1Cost, // Step 1: fixed only
      mileage: travelMetrics.distanceMiles * PAYMENT_STRUCTURE.mileage * 2, // Steps 2 & 3: round trip mileage
      driveTime: (travelMetrics.durationMinutes / 60) * PAYMENT_STRUCTURE.driveTime * 2, // Steps 2 & 3: round trip drive time
      serviceTime: serviceHours * PAYMENT_STRUCTURE.serviceTime, // Step 2: service time
      total: totalCost,
      formattedEstimate: `$${Math.round(totalCost)}`,
      travelMetrics,
      workerType: 'boombox_driver'
    };
  } catch (error) {
    console.error('Error calculating total Boombox driver estimate:', error);
    // Return fallback estimate
    return {
      fixed: 45,
      mileage: 15, // Fallback estimate
      driveTime: 10, // Fallback estimate  
      serviceTime: 7.5, // Fallback estimate
      total: 77.5,
      formattedEstimate: '$78',
      travelMetrics: { distanceMiles: 10, durationMinutes: 20 },
      workerType: 'boombox_driver'
    };
  }
}

/**
 * Calculate total job estimate for Moving Partner using corrected logic
 * Only Step 2 gets compensation (service time only)
 */
export async function calculateTotalMovingPartnerEstimate(
  appointmentType: string,
  numberOfUnits: number,
  movingPartnerHourlyRate: number,
  estimatedServiceHours?: number
): Promise<PaymentBreakdown> {
  try {
    // Only Step 2 has cost for moving partners
    const step2Cost = await calculateStepSpecificCost(2, 'moving_partner', '', appointmentType, numberOfUnits, movingPartnerHourlyRate, estimatedServiceHours);

    // Calculate service hours for tracking
    let serviceHours: number;
    if (estimatedServiceHours) {
      serviceHours = estimatedServiceHours;
    } else {
      const timePerUnit = MOVING_PARTNER_LOADING_TIME_PER_UNIT[appointmentType as keyof typeof MOVING_PARTNER_LOADING_TIME_PER_UNIT] || 1.0;
      serviceHours = Math.max(1.0, numberOfUnits * timePerUnit);
    }

    return {
      fixed: 0, // No fixed fee for moving partners
      mileage: 0, // No mileage compensation
      driveTime: 0, // No drive time compensation
      serviceTime: step2Cost, // Only service time
      total: step2Cost,
      formattedEstimate: `$${Math.round(step2Cost)}`,
      travelMetrics: { distanceMiles: 0, durationMinutes: 0 },
      workerType: 'moving_partner'
    };
  } catch (error) {
    console.error('Error calculating total moving partner estimate:', error);
    // Return fallback estimate
    const fallbackCost = numberOfUnits * movingPartnerHourlyRate; // 1 hour per unit minimum
    return {
      fixed: 0,
      mileage: 0,
      driveTime: 0,
      serviceTime: fallbackCost,
      total: fallbackCost,
      formattedEstimate: `$${Math.round(fallbackCost)}`,
      travelMetrics: { distanceMiles: 0, durationMinutes: 0 },
      workerType: 'moving_partner'
    };
  }
} 