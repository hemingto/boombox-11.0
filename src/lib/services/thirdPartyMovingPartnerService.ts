/**
 * @fileoverview Third Party Moving Partner Service - Business logic for fetching third-party moving partners
 * @source Extracted from boombox-10.0/src/app/components/reusablecomponents/thirdpartylaborlist.tsx
 * 
 * SERVICE FUNCTIONALITY:
 * - Fetches third-party moving partner data from API
 * - Implements caching to prevent redundant API calls
 * - Handles error states and loading states
 * - Provides type-safe interface for partner data
 * 
 * API ROUTES USED:
 * - GET /api/moving-partners/third-party (updated from /api/third-party-moving-partners)
 */

export interface ThirdPartyMovingPartner {
  id: number;
  title: string;
  description: string;
  imageSrc: string;
  rating: number;
  reviews: string;
  weblink: string;
  gmblink: string;
}

export interface ThirdPartyMovingPartnerServiceResult {
  partners: ThirdPartyMovingPartner[];
  isLoading: boolean;
  error: string | null;
}

class ThirdPartyMovingPartnerService {
  private static instance: ThirdPartyMovingPartnerService;
  private cachedPartners: ThirdPartyMovingPartner[] | null = null;
  private isLoading = false;
  private error: string | null = null;
  private fetchPromise: Promise<ThirdPartyMovingPartnerServiceResult> | null = null;

  private constructor() {}

  public static getInstance(): ThirdPartyMovingPartnerService {
    if (!ThirdPartyMovingPartnerService.instance) {
      ThirdPartyMovingPartnerService.instance = new ThirdPartyMovingPartnerService();
    }
    return ThirdPartyMovingPartnerService.instance;
  }

  /**
   * Fetches third-party moving partners with caching
   * @returns Promise with partners data, loading state, and error state
   */
  public async fetchPartners(): Promise<ThirdPartyMovingPartnerServiceResult> {
    // Return cached data if available
    if (this.cachedPartners) {
      return {
        partners: this.cachedPartners,
        isLoading: false,
        error: null,
      };
    }

    // If already fetching, return the same promise to all callers
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Create and store the fetch promise
    this.fetchPromise = this.performFetch();
    
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.fetchPromise = null;
    }
  }

  private async performFetch(): Promise<ThirdPartyMovingPartnerServiceResult> {
    try {
      this.isLoading = true;
      this.error = null;

      const response = await fetch("/api/moving-partners/third-party");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch third-party moving partners: ${response.status} ${response.statusText}`);
      }

      const data: ThirdPartyMovingPartner[] = await response.json();
      
      // Validate the response data
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: expected array of partners");
      }

      // Cache the successful result
      this.cachedPartners = data;

      return {
        partners: data,
        isLoading: false,
        error: null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load third party moving partners";
      this.error = errorMessage;
      
      console.error("ThirdPartyMovingPartnerService error:", err);

      return {
        partners: [],
        isLoading: false,
        error: errorMessage,
      };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Clears the cached partners data (useful for forcing refresh)
   */
  public clearCache(): void {
    this.cachedPartners = null;
    this.error = null;
    this.fetchPromise = null;
  }

  /**
   * Gets the current cached partners without making an API call
   */
  public getCachedPartners(): ThirdPartyMovingPartner[] | null {
    return this.cachedPartners;
  }

  /**
   * Gets the current error state
   */
  public getCurrentError(): string | null {
    return this.error;
  }

  /**
   * Gets the current loading state
   */
  public getCurrentLoadingState(): boolean {
    return this.isLoading;
  }
}

export default ThirdPartyMovingPartnerService;
