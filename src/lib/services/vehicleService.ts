/**
 * @fileoverview Vehicle Service - API calls for vehicle management
 * @source Extracted from boombox-10.0/src/app/components/reusablecomponents/addedvehicle.tsx
 *
 * SERVICE FUNCTIONALITY:
 * Centralized API service for vehicle operations including fetching, removing,
 * and insurance document uploads. Supports both driver and mover user types.
 *
 * @refactor Extracted API logic from AddedVehicle component for better separation of concerns
 */

export interface Vehicle {
  id: number;
  driverId: number | null;
  movingPartnerId: number | null;
  haulingPartnerId: number | null;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  isApproved: boolean;
  frontVehiclePhoto: string | null;
  backVehiclePhoto: string | null;
  autoInsurancePhoto: string | null;
  boomboxCapacity: number | null;
}

export type UserType = 'driver' | 'mover' | 'hauler';

/**
 * Vehicle API service class
 */
export class VehicleService {
  /**
   * Get API endpoint based on user type
   */
  private static getApiBase(userType: UserType): string {
    if (userType === 'driver') return '/api/drivers';
    if (userType === 'hauler') return '/api/hauling-partners';
    return '/api/moving-partners';
  }

  /**
   * Fetch vehicle information for a user
   */
  static async fetchVehicle(
    userId: string,
    userType: UserType
  ): Promise<Vehicle | null> {
    const endpoint = `${this.getApiBase(userType)}/${userId}/vehicle`;

    const response = await fetch(endpoint);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch vehicle info: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Remove a vehicle
   */
  static async removeVehicle(
    userId: string,
    userType: UserType
  ): Promise<void> {
    const endpoint = `${this.getApiBase(userType)}/${userId}/remove-vehicle`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to remove vehicle: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Upload insurance document
   */
  static async uploadInsurance(
    userId: string,
    userType: UserType,
    file: File
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `${this.getApiBase(userType)}/${userId}/upload-new-insurance`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload insurance: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Create a new vehicle
   * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx (handleSubmit function)
   */
  static async createVehicle(
    userId: string,
    userType: UserType,
    vehicleData: {
      make: string;
      model: string;
      year: string;
      licensePlate: string;
      hasTrailerHitch?: boolean;
      boomboxCapacity?: number | null;
      frontVehiclePhoto?: string | null;
      backVehiclePhoto?: string | null;
      autoInsurancePhoto?: string | null;
    }
  ): Promise<Vehicle> {
    const endpoint = `${this.getApiBase(userType)}/${userId}/vehicle`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create vehicle');
    }

    return response.json();
  }

  /**
   * Upload vehicle photos to Cloudinary
   * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx (photo upload logic)
   */
  static async uploadVehiclePhoto(
    userId: string,
    userType: UserType,
    file: File,
    fieldName: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldName', fieldName);
    formData.append('driverId', userId); // Legacy field name for compatibility

    let uploadEndpoint: string;
    if (userType === 'driver') {
      uploadEndpoint = '/api/uploads/photos';
    } else if (userType === 'hauler') {
      uploadEndpoint = `/api/hauling-partners/${userId}/upload-vehicle-photos`;
    } else {
      uploadEndpoint = `/api/moving-partners/${userId}/upload-vehicle-photos`;
    }

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload photo');
    }

    const uploadData = await response.json();
    return uploadData.url;
  }

  /**
   * Refresh vehicle data after an operation
   */
  static async refreshVehicle(
    userId: string,
    userType: UserType
  ): Promise<Vehicle | null> {
    return this.fetchVehicle(userId, userType);
  }

  /**
   * Fetch all vehicles for a moving partner (movers can have multiple vehicles)
   * Returns an array of vehicles for the mover's fleet
   */
  static async fetchAllVehicles(
    userId: string,
    userType: UserType = 'mover'
  ): Promise<Vehicle[]> {
    const endpoint =
      userType === 'hauler'
        ? `/api/hauling-partners/${userId}/vehicle`
        : `/api/moving-partners/${userId}/vehicles`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch vehicles: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Remove a specific vehicle by ID (for movers with multiple vehicles)
   */
  static async removeVehicleById(
    userId: string,
    userType: UserType,
    vehicleId: number
  ): Promise<void> {
    const endpoint = `${this.getApiBase(userType)}/${userId}/remove-vehicle?vehicleId=${vehicleId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to remove vehicle: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Refresh all vehicles for a mover after an operation
   */
  static async refreshAllVehicles(
    userId: string,
    userType: UserType = 'mover'
  ): Promise<Vehicle[]> {
    return this.fetchAllVehicles(userId, userType);
  }
}
