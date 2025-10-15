/**
 * @fileoverview Test utilities for access storage components, hooks, and services
 * @source Created for comprehensive testing support
 * 
 * UTILITIES PROVIDED:
 * - Mock data factories for consistent test data
 * - Common test setup and teardown functions
 * - Mock implementations for external dependencies
 * - Assertion helpers for complex objects
 * - Test environment configuration
 * 
 * @refactor Centralized testing utilities for access storage functionality
 */

import { renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type {
  AccessStorageFormState,
  AccessStorageSubmissionData,
  StorageUnitUsage,
  FormattedStorageUnit,
  SelectedLabor,
  DeliveryReason,
  PlanType,
  AppointmentType,
  AccessStorageStep
} from '@/types/accessStorage.types';

// ===== MOCK DATA FACTORIES =====

export const createMockSession = (overrides: Partial<any> = {}) => ({
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides.user
  },
  expires: '2024-12-31T23:59:59.999Z',
  ...overrides
});

export const createMockRouter = (overrides: Partial<any> = {}) => ({
  push: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  ...overrides
});

export const createMockFormState = (overrides: Partial<AccessStorageFormState> = {}): AccessStorageFormState => ({
  // Step 1: Delivery Purpose & Address
  deliveryReason: DeliveryReason.ACCESS_ITEMS,
  address: '123 Test St, Los Angeles, CA 90210',
  zipCode: '90210',
  coordinates: { lat: 34.0522, lng: -118.2437 },
  cityName: 'Los Angeles',
  selectedStorageUnits: ['unit-101', 'unit-102'],
  selectedPlan: 'option1',
  selectedPlanName: 'Do It Yourself Plan',
  planType: PlanType.DIY,
  
  // Step 2: Scheduling
  scheduledDate: new Date('2024-02-15T10:00:00Z'),
  scheduledTimeSlot: '10:00am-12:00pm',
  
  // Step 3: Labor Selection
  selectedLabor: null,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  loadingHelpPrice: '$0',
  loadingHelpDescription: 'No loading help',
  parsedLoadingHelpPrice: 0,
  
  // Step 4: Confirmation
  description: 'Test delivery description',
  appointmentType: AppointmentType.STORAGE_UNIT_ACCESS,
  
  // Calculated values
  calculatedTotal: 150.00,
  monthlyStorageRate: 100.00,
  monthlyInsuranceRate: 10.00,
  
  // Navigation state
  currentStep: AccessStorageStep.DELIVERY_PURPOSE,
  isPlanDetailsVisible: false,
  contentHeight: null,
  
  ...overrides
});

export const createMockSubmissionData = (overrides: Partial<AccessStorageSubmissionData> = {}): AccessStorageSubmissionData => ({
  userId: 'test-user-123',
  address: '123 Test St, Los Angeles, CA 90210',
  zipCode: '90210',
  selectedPlanName: 'Do It Yourself Plan',
  appointmentDateTime: '2024-02-15T10:00:00.000Z',
  deliveryReason: DeliveryReason.ACCESS_ITEMS,
  planType: PlanType.DIY,
  selectedStorageUnits: ['unit-101', 'unit-102'],
  description: 'Test delivery description',
  appointmentType: AppointmentType.STORAGE_UNIT_ACCESS,
  parsedLoadingHelpPrice: 0,
  calculatedTotal: 150.00,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  includeUserData: true,
  ...overrides
});

export const createMockStorageUnit = (overrides: Partial<StorageUnitUsage> = {}): StorageUnitUsage => ({
  id: 1,
  storageUnit: {
    id: 101,
    storageUnitNumber: 'BX001',
  },
  usageStartDate: '2024-01-15T10:00:00Z',
  returnDate: '2024-02-15T10:00:00Z',
  mainImage: 'https://example.com/image1.jpg',
  description: 'Living room furniture',
  ...overrides
});

export const createMockFormattedStorageUnit = (overrides: Partial<FormattedStorageUnit> = {}): FormattedStorageUnit => ({
  id: '101',
  imageSrc: 'https://example.com/image1.jpg',
  title: 'Boombox BX001',
  pickUpDate: '1/15/2024',
  lastAccessedDate: '2/15/2024',
  description: 'Living room furniture',
  ...overrides
});

export const createMockSelectedLabor = (overrides: Partial<SelectedLabor> = {}): SelectedLabor => ({
  id: 'labor-123',
  price: '$150/hr',
  title: 'Professional Movers',
  onfleetTeamId: 'team-456',
  ...overrides
});

// ===== MOCK IMPLEMENTATIONS =====

export const setupMockDependencies = () => {
  const mockRouter = createMockRouter();
  const mockSession = createMockSession();
  
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useSession as jest.Mock).mockReturnValue({ data: mockSession });
  
  return { mockRouter, mockSession };
};

export const setupMockFetch = (responses: any[] = []) => {
  const mockFetch = jest.fn();
  
  responses.forEach((response, index) => {
    if (index === 0) {
      mockFetch.mockResolvedValueOnce(response);
    } else {
      mockFetch.mockResolvedValue(response);
    }
  });
  
  if (responses.length === 0) {
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { appointmentId: 123 }
      }),
      headers: new Map([['x-request-id', 'test-req-123']])
    });
  }
  
  global.fetch = mockFetch;
  return mockFetch;
};

export const createMockApiResponse = (data: any, success: boolean = true, error?: any) => ({
  ok: success,
  status: success ? 200 : 400,
  statusText: success ? 'OK' : 'Bad Request',
  json: async () => success ? { success: true, data } : { success: false, error: error || 'API Error' },
  headers: new Map([['x-request-id', 'test-req-123']])
});

export const createMockNetworkError = (message: string = 'Network error') => {
  const error = new Error(message);
  error.name = 'NetworkError';
  return error;
};

// ===== TEST HELPERS =====

export const expectFormStateToMatch = (actual: AccessStorageFormState, expected: Partial<AccessStorageFormState>) => {
  Object.keys(expected).forEach(key => {
    const formKey = key as keyof AccessStorageFormState;
    expect(actual[formKey]).toEqual(expected[formKey]);
  });
};

export const expectApiCallToMatch = (mockFetch: jest.MockedFunction<typeof fetch>, expectedUrl: string, expectedOptions: any) => {
  expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.objectContaining(expectedOptions));
};

export const expectErrorToMatch = (error: any, expectedCode: string, expectedMessage?: string) => {
  expect(error.code).toBe(expectedCode);
  if (expectedMessage) {
    expect(error.message).toBe(expectedMessage);
  }
};

// ===== ASYNC TEST HELPERS =====

export const waitForHookToUpdate = async (hookResult: any, condition: () => boolean, timeout: number = 5000) => {
  const startTime = Date.now();
  
  while (!condition() && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  if (!condition()) {
    throw new Error(`Hook did not update within ${timeout}ms`);
  }
};

export const simulateAsyncOperation = (duration: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

// ===== VALIDATION HELPERS =====

export const validateFormSubmissionData = (data: AccessStorageSubmissionData) => {
  const requiredFields = [
    'userId',
    'address',
    'zipCode',
    'selectedPlanName',
    'appointmentDateTime',
    'deliveryReason',
    'planType',
    'selectedStorageUnits',
    'appointmentType'
  ];
  
  const missingFields = requiredFields.filter(field => 
    !data[field as keyof AccessStorageSubmissionData] || 
    (Array.isArray(data[field as keyof AccessStorageSubmissionData]) && 
     (data[field as keyof AccessStorageSubmissionData] as any[]).length === 0)
  );
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

export const validateStorageUnitData = (units: FormattedStorageUnit[]) => {
  const requiredFields = ['id', 'title', 'pickUpDate', 'lastAccessedDate', 'description'];
  
  return units.every(unit => 
    requiredFields.every(field => 
      unit[field as keyof FormattedStorageUnit] !== undefined &&
      unit[field as keyof FormattedStorageUnit] !== null
    )
  );
};

// ===== MOCK CLEANUP =====

export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  // Reset global mocks
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRestore();
  }
};

// ===== TEST ENVIRONMENT SETUP =====

export const setupTestEnvironment = () => {
  // Mock console methods to reduce noise in tests
  const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
  };
  
  // Mock URL methods for file handling
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url-123');
  global.URL.revokeObjectURL = jest.fn();
  
  // Mock IntersectionObserver for components that might use it
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
  
  // Mock ResizeObserver for components that might use it
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
  
  return { consoleSpy };
};

export const teardownTestEnvironment = () => {
  cleanupMocks();
  
  // Clean up global mocks
  delete (global as any).IntersectionObserver;
  delete (global as any).ResizeObserver;
  delete (global as any).URL.createObjectURL;
  delete (global as any).URL.revokeObjectURL;
};

// ===== COMMON TEST SCENARIOS =====

export const createSuccessfulSubmissionScenario = () => ({
  formState: createMockFormState({
    deliveryReason: DeliveryReason.ACCESS_ITEMS,
    address: '123 Test St',
    selectedStorageUnits: ['unit-1'],
    selectedPlan: 'option1',
    scheduledDate: new Date('2024-02-15T10:00:00Z'),
    scheduledTimeSlot: '10:00am-12:00pm'
  }),
  apiResponse: createMockApiResponse({ appointmentId: 123 }),
  expectedSubmissionData: createMockSubmissionData()
});

export const createValidationErrorScenario = (missingField: keyof AccessStorageFormState) => ({
  formState: createMockFormState({ [missingField]: null }),
  expectedError: `Please provide ${missingField}`
});

export const createNetworkErrorScenario = () => ({
  formState: createMockFormState(),
  networkError: createMockNetworkError('Failed to fetch'),
  expectedError: 'Network error. Please check your connection and try again.'
});

// ===== EXPORT ALL UTILITIES =====

export const AccessStorageTestUtils = {
  // Mock factories
  createMockSession,
  createMockRouter,
  createMockFormState,
  createMockSubmissionData,
  createMockStorageUnit,
  createMockFormattedStorageUnit,
  createMockSelectedLabor,
  
  // Mock setup
  setupMockDependencies,
  setupMockFetch,
  createMockApiResponse,
  createMockNetworkError,
  
  // Test helpers
  expectFormStateToMatch,
  expectApiCallToMatch,
  expectErrorToMatch,
  waitForHookToUpdate,
  simulateAsyncOperation,
  
  // Validation
  validateFormSubmissionData,
  validateStorageUnitData,
  
  // Environment
  setupTestEnvironment,
  teardownTestEnvironment,
  cleanupMocks,
  
  // Scenarios
  createSuccessfulSubmissionScenario,
  createValidationErrorScenario,
  createNetworkErrorScenario
};

export default AccessStorageTestUtils;
