/**
 * @fileoverview Google Maps geocoding service for address coordinates
 * @source boombox-10.0/src/app/api/onfleet/update-task/route.ts (geocodeAddress function)
 * @refactor Extracted geocoding logic into centralized service
 */

/**
 * Geocodes an address using Google Maps API
 * @param address - The address string to geocode
 * @returns Coordinates as [longitude, latitude] for Onfleet compatibility, or null if failed
 */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable");
      return null;
    }
    
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return [location.lng, location.lat]; // Onfleet expects [longitude, latitude]
    }
    
    console.error("❌ Geocoding failed:", data);
    return null;
  } catch (error) {
    console.error("❌ Error geocoding address:", error);
    return null;
  }
} 