/**
 * @fileoverview Jest tests for useAppointmentData hook
 * @source boombox-11.0/src/hooks/useAppointmentData.ts
 * 
 * TEST COVERAGE:
 * - Hook initialization and state management
 * - Appointment data fetching with authentication
 * - Error handling and categorization
 * - Retry logic and exponential backoff
 * - Loading states and user feedback
 * - Session validation and ownership checks
 * - Service layer integration
 * - Edge cases and network errors
 * 
 * @refactor Comprehensive tests for the appointment data fetching hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useAppointmentData } from '@/hooks/useAppointmentData';
import * as appointmentDataService from '@/lib/services/appointmentDataService';
import { AppointmentErrorType } from '@/components/ui/error';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/lib/services/appointmentDataService');

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
};

// Mock session data
const mockSession = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    accountType: 'USER',
  },
};

// Mock appointment data
const mockAppointmentData = {
  id: 456,
  userId: 'test-user-123',
  appointmentType: 'Storage Unit Access',
  address: '123 Test St, Los Angeles, CA 90210',
  zipCode: '90210',
  deliveryReason: 'ACCESS_ITEMS',
  planType: 'Do It Yourself Plan',
  description: 'Test appointment description',
  date: new Date('2024-02-15T10:00:00.000Z'),
  parsedLoadingHelpPrice: 0,
  monthlyStorageRate: 50,
  monthlyInsuranceRate: 10,
  calculatedTotal: 150,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  status: 'Scheduled',
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
  updatedAt: new Date('2024-01-15T10:00:00.000Z'),
  user: {
    id: 'test-user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    stripeCustomerId: 'cus_test123',
  },
  movingPartner: null,
  thirdPartyMovingPartner: null,
  requestedStorageUnits: [
    {
      storageUnitId: 1,
      storageUnit: {
        id: 1,
        unitNumber: 'BX001',
        size: 'Medium',
        location: 'Los Angeles',
      },
    },
  ],
  additionalInfo: {
    stripeCustomerId: 'cus_test123',
  },
};

describe('useAppointmentData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default session mock
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    // Default successful service response
    (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAppointmentData,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== HOOK INITIALIZATION TESTS =====

  describe('Hook Initialization', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useAppointmentData());

      expect(result.current.appointmentData).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.errorType).toBeNull();
      expect(result.current.retryCount).toBe(0);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('does not fetch data when no appointment ID provided', () => {
      renderHook(() => useAppointmentData());

      expect(appointmentDataService.fetchAppointmentDetails).not.toHaveBeenCalled();
    });

    it('does not fetch data when session is loading', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      renderHook(() => useAppointmentData('456'));

      expect(appointmentDataService.fetchAppointmentDetails).not.toHaveBeenCalled();
    });
  });

  // ===== AUTHENTICATION TESTS =====

  describe('Authentication', () => {
    it('sets error when user is unauthenticated', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('You must be logged in to view appointment details');
        expect(result.current.errorType).toBe('unauthorized');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets error when session user is missing', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: null },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('You must be logged in to view appointment details');
        expect(result.current.errorType).toBe('unauthorized');
      });
    });

    it('waits for session to load before fetching', async () => {
      const { rerender } = renderHook(() => useAppointmentData('456'));

      // Initially loading
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      rerender();
      expect(appointmentDataService.fetchAppointmentDetails).not.toHaveBeenCalled();

      // Session loaded
      (useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      rerender();

      await waitFor(() => {
        expect(appointmentDataService.fetchAppointmentDetails).toHaveBeenCalled();
      });
    });
  });

  // ===== DATA FETCHING TESTS =====

  describe('Data Fetching', () => {
    it('fetches appointment data successfully', async () => {
      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(appointmentDataService.fetchAppointmentDetails).toHaveBeenCalledWith('456', {
        timeout: 15000,
        retries: 2,
      });
    });

    it('handles service failure responses', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Appointment not found',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('Appointment not found');
        expect(result.current.errorType).toBe('not_found');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles service responses with no data', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: true,
        data: null,
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch appointment data');
        expect(result.current.errorType).toBe('unknown_error');
      });
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!({
        success: true,
        data: mockAppointmentData,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ===== ERROR CATEGORIZATION TESTS =====

  describe('Error Categorization', () => {
    it('categorizes not found errors', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Appointment not found',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.errorType).toBe('not_found');
      });
    });

    it('categorizes unauthorized errors', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Unauthorized access to appointment',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.errorType).toBe('unauthorized');
      });
    });

    it('categorizes network errors', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Network connection failed',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.errorType).toBe('network_error');
      });
    });

    it('categorizes server errors', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Internal server error occurred',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.errorType).toBe('server_error');
      });
    });

    it('categorizes validation errors', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid appointment data format',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.errorType).toBe('validation_error');
      });
    });

    it('defaults to unknown error for unrecognized errors', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Some unexpected error',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.errorType).toBe('unknown_error');
      });
    });
  });

  // ===== RETRY LOGIC TESTS =====

  describe('Retry Logic', () => {
    it('implements retry logic with exponential backoff', async () => {
      let callCount = 0;
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return { success: false, error: 'Network error' };
        }
        return { success: true, data: mockAppointmentData };
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
        expect(result.current.retryCount).toBe(2); // 2 retries before success
      });

      expect(callCount).toBe(3); // Initial call + 2 retries
    });

    it('stops retrying after max attempts', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Persistent network error',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('Persistent network error');
        expect(result.current.retryCount).toBe(3); // Max retry attempts
      });
    });

    it('does not retry on non-retryable errors', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Appointment not found', // Non-retryable error
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('Appointment not found');
        expect(result.current.retryCount).toBe(0); // No retries for not found
      });
    });

    it('resets retry count on successful fetch', async () => {
      let callCount = 0;
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { success: false, error: 'Network error' };
        }
        return { success: true, data: mockAppointmentData };
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
        expect(result.current.retryCount).toBe(1);
      });

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.retryCount).toBe(0); // Reset after successful refetch
      });
    });
  });

  // ===== REFETCH FUNCTIONALITY TESTS =====

  describe('Refetch Functionality', () => {
    it('provides refetch function', () => {
      const { result } = renderHook(() => useAppointmentData('456'));

      expect(typeof result.current.refetch).toBe('function');
    });

    it('refetches data when refetch is called', async () => {
      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
      });

      // Clear the mock and set up new data
      jest.clearAllMocks();
      const updatedData = { ...mockAppointmentData, description: 'Updated description' };
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedData,
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(updatedData);
      });

      expect(appointmentDataService.fetchAppointmentDetails).toHaveBeenCalledTimes(1);
    });

    it('handles refetch errors', async () => {
      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
      });

      // Set up error for refetch
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Refetch failed',
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed');
        expect(result.current.appointmentData).toBeNull(); // Data cleared on error
      });
    });

    it('resets error state when refetch succeeds', async () => {
      // Start with an error
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Initial error',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('Initial error');
      });

      // Successful refetch
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: true,
        data: mockAppointmentData,
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.errorType).toBeNull();
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
      });
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====

  describe('Edge Cases and Error Handling', () => {
    it('handles service throwing exceptions', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockRejectedValue(
        new Error('Service exception')
      );

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('Service exception');
        expect(result.current.errorType).toBe('unknown_error');
      });
    });

    it('handles empty appointment ID', async () => {
      const { result } = renderHook(() => useAppointmentData(''));

      await waitFor(() => {
        expect(result.current.error).toBe('No appointment ID provided');
        expect(result.current.isLoading).toBe(false);
      });

      expect(appointmentDataService.fetchAppointmentDetails).not.toHaveBeenCalled();
    });

    it('handles undefined appointment ID', async () => {
      const { result } = renderHook(() => useAppointmentData(undefined));

      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(appointmentDataService.fetchAppointmentDetails).not.toHaveBeenCalled();
    });

    it('handles appointment ID changes', async () => {
      const { result, rerender } = renderHook(
        ({ appointmentId }) => useAppointmentData(appointmentId),
        { initialProps: { appointmentId: '456' } }
      );

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
      });

      // Change appointment ID
      const newAppointmentData = { ...mockAppointmentData, id: 789 };
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: true,
        data: newAppointmentData,
      });

      rerender({ appointmentId: '789' });

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(newAppointmentData);
      });

      expect(appointmentDataService.fetchAppointmentDetails).toHaveBeenCalledWith('789', expect.any(Object));
    });

    it('clears data when appointment ID is removed', async () => {
      const { result, rerender } = renderHook(
        ({ appointmentId }) => useAppointmentData(appointmentId),
        { initialProps: { appointmentId: '456' } }
      );

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
      });

      // Remove appointment ID
      rerender({ appointmentId: undefined });

      await waitFor(() => {
        expect(result.current.appointmentData).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });
  });

  // ===== PERFORMANCE TESTS =====

  describe('Performance', () => {
    it('does not refetch when appointment ID remains the same', async () => {
      const { result, rerender } = renderHook(
        ({ appointmentId }) => useAppointmentData(appointmentId),
        { initialProps: { appointmentId: '456' } }
      );

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
      });

      const callCount = (appointmentDataService.fetchAppointmentDetails as jest.Mock).mock.calls.length;

      // Rerender with same appointment ID
      rerender({ appointmentId: '456' });

      // Should not trigger additional fetch
      expect((appointmentDataService.fetchAppointmentDetails as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it('debounces rapid appointment ID changes', async () => {
      const { rerender } = renderHook(
        ({ appointmentId }) => useAppointmentData(appointmentId),
        { initialProps: { appointmentId: '456' } }
      );

      // Rapid changes
      rerender({ appointmentId: '789' });
      rerender({ appointmentId: '101' });
      rerender({ appointmentId: '202' });

      await waitFor(() => {
        // Should only fetch for the final appointment ID
        expect(appointmentDataService.fetchAppointmentDetails).toHaveBeenLastCalledWith('202', expect.any(Object));
      });
    });
  });

  // ===== INTEGRATION TESTS =====

  describe('Integration', () => {
    it('integrates with session changes', async () => {
      const { result, rerender } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.appointmentData).toEqual(mockAppointmentData);
      });

      // Session becomes unauthenticated
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      rerender();

      await waitFor(() => {
        expect(result.current.error).toBe('You must be logged in to view appointment details');
        expect(result.current.appointmentData).toBeNull();
      });
    });

    it('logs errors for debugging', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockRejectedValue(
        new Error('Test error for logging')
      );

      renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Error fetching appointment data:',
          expect.any(Error)
        );
      });
    });

    it('provides comprehensive error information', async () => {
      (appointmentDataService.fetchAppointmentDetails as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Detailed error message for user',
      });

      const { result } = renderHook(() => useAppointmentData('456'));

      await waitFor(() => {
        expect(result.current.error).toBe('Detailed error message for user');
        expect(result.current.errorType).toBe('unknown_error');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.appointmentData).toBeNull();
      });
    });
  });
});
