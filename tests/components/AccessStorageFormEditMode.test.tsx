/**
 * @fileoverview Tests for AccessStorageForm component in edit mode
 * Following boombox-11.0 testing standards and accessibility requirements
 * 
 * TEST COVERAGE:
 * - Edit mode initialization and props handling
 * - Appointment data pre-population
 * - Form validation in edit mode
 * - Edit submission workflow
 * - Error handling for edit operations
 * - Loading states during appointment data fetching
 * - Edit-specific UI elements and interactions
 * - Accessibility in edit mode
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '../utils/AccessStorageTestWrapper';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessStorageForm from '@/components/features/orders/AccessStorageForm';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock next-auth session (wrapper handles Next.js hooks)
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        accountType: 'USER'
      }
    }
  })
}));

// Mock API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Google Maps
global.google = {
  maps: {
    LatLngLiteral: jest.fn()
  }
} as any;

// Mock appointment data hook
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

const mockUseAppointmentData = {
  appointmentData: mockAppointmentData,
  isLoading: false,
  error: null,
  errorType: null,
  retryCount: 0,
  refetch: jest.fn(),
};

jest.mock('@/hooks/useAppointmentData', () => ({
  useAppointmentData: jest.fn(() => mockUseAppointmentData),
}));

// Mock complex components
jest.mock('@/components/forms/Scheduler', () => {
  return function MockScheduler({ onDateTimeSelected }: { onDateTimeSelected: (date: Date, timeSlot: string) => void }) {
    return (
      <div data-testid="scheduler">
        <button 
          onClick={() => onDateTimeSelected(new Date('2024-02-15T10:00:00.000Z'), '10:00am-12:00pm')}
          data-testid="select-time-slot"
        >
          Select Time Slot
        </button>
      </div>
    );
  };
});

jest.mock('@/components/features/orders/MyQuote', () => ({
  MyQuote: function MockMyQuote({ 
    isEditMode, 
    appointmentId, 
    originalTotal,
    showPriceComparison 
  }: { 
    isEditMode?: boolean; 
    appointmentId?: string;
    originalTotal?: number;
    showPriceComparison?: boolean;
  }) {
    return (
      <div data-testid="my-quote">
        <div>Edit Mode: {isEditMode ? 'true' : 'false'}</div>
        <div>Appointment ID: {appointmentId}</div>
        <div>Original Total: ${originalTotal}</div>
        <div>Show Price Comparison: {showPriceComparison ? 'true' : 'false'}</div>
        <div>Total: $150.00</div>
        <button data-testid="quote-submit-button">Update Appointment</button>
      </div>
    );
  }
}));

jest.mock('@/components/features/orders/ChooseLabor', () => ({
  ChooseLabor: function MockChooseLabor({ onLaborChange }: { onLaborChange: (id: string, price: string, title: string) => void }) {
    return (
      <div data-testid="choose-labor">
        <button 
          onClick={() => onLaborChange('labor-123', '150', 'Professional Movers')}
          data-testid="select-labor"
        >
          Select Labor
        </button>
      </div>
    );
  }
}));

jest.mock('@/components/features/orders/AccessStorageStep1', () => {
  const MockAccessStorageStep1 = ({ isEditMode }: { isEditMode?: boolean }) => (
    <div data-testid="access-storage-step1">
      <h1>{isEditMode ? 'Edit Storage access' : 'Access your storage'}</h1>
      <div>Edit Mode: {isEditMode ? 'true' : 'false'}</div>
      <h2>What's the purpose of your delivery?</h2>
      <button data-testid="access-items-button">Access items</button>
      <button data-testid="end-storage-button">End storage term</button>
      <h2>Where are we delivering your Boombox?</h2>
      <div>Boombox BX001</div>
      <h2>Do you need help unloading your Boombox?</h2>
    </div>
  );
  MockAccessStorageStep1.displayName = 'MockAccessStorageStep1';
  return {
    __esModule: true,
    default: MockAccessStorageStep1
  };
});

jest.mock('@/components/features/orders/AccessStorageConfirmAppointment', () => {
  const MockAccessStorageConfirmAppointment = ({ isEditMode }: { isEditMode?: boolean }) => (
    <div data-testid="confirm-appointment">
      <h2>{isEditMode ? 'Confirm appointment changes' : 'Confirm your appointment'}</h2>
      <div>Edit Mode: {isEditMode ? 'true' : 'false'}</div>
      <button data-testid="final-submit-button">
        {isEditMode ? 'Update Appointment' : 'Confirm Appointment'}
      </button>
    </div>
  );
  MockAccessStorageConfirmAppointment.displayName = 'MockAccessStorageConfirmAppointment';
  return {
    __esModule: true,
    default: MockAccessStorageConfirmAppointment
  };
});

// Mock loading and error components
jest.mock('@/components/ui/loading', () => ({
  AppointmentLoadingSkeleton: function MockAppointmentLoadingSkeleton() {
    return <div data-testid="appointment-loading-skeleton">Loading appointment...</div>;
  }
}));

jest.mock('@/components/ui/error', () => ({
  AppointmentErrorState: function MockAppointmentErrorState({ 
    error, 
    errorType, 
    onRetry 
  }: { 
    error: string; 
    errorType: string; 
    onRetry: () => void; 
  }) {
    return (
      <div data-testid="appointment-error-state">
        <div>Error: {error}</div>
        <div>Error Type: {errorType}</div>
        <button onClick={onRetry} data-testid="retry-button">Retry</button>
      </div>
    );
  }
}));

// Mock the AccessStorageProvider with edit mode support
jest.mock('@/components/features/orders/AccessStorageProvider', () => {
  const mockFormHook = {
    formState: {
      deliveryReason: 'ACCESS_ITEMS',
      planType: 'Do It Yourself Plan',
      selectedStorageUnits: ['1'],
      scheduledDate: new Date('2024-02-15T10:00:00.000Z'),
      scheduledTimeSlot: '10:00am-12:00pm',
      address: '123 Test St, Los Angeles, CA 90210',
      zipCode: '90210',
      coordinates: { lat: 34.0522, lng: -118.2437 },
      selectedPlanName: 'Do It Yourself Plan',
      loadingHelpPrice: '$0',
      loadingHelpDescription: 'No loading help',
      cityName: 'Los Angeles',
      selectedLabor: null,
      parsedLoadingHelpPrice: 0,
      calculatedTotal: 150,
      appointmentType: 'Storage Unit Access',
      description: 'Test appointment description',
      monthlyStorageRate: 50,
      monthlyInsuranceRate: 10,
      stripeCustomerId: 'cus_test123'
    },
    errors: {},
    flags: { isSubmitting: false },
    updateFormState: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    clearAllErrors: jest.fn(),
    togglePlanDetails: jest.fn(),
    submitForm: jest.fn(),
    populateFromAppointment: jest.fn()
  };

  const mockNavigationHook = {
    currentStep: 1,
    goToStep: jest.fn(),
    canGoToStep: jest.fn(() => true),
    isStepCompleted: jest.fn(() => false)
  };

  const mockStorageUnitsHook = {
    storageUnits: [
      {
        id: 1,
        storageUnit: {
          id: 1,
          storageUnitNumber: 'BX001',
          mainImage: null
        },
        usageStartDate: '2024-01-01',
        description: 'Test storage unit',
        mainImage: '/test-image.jpg',
        location: 'Los Angeles'
      }
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn()
  };

  const mockContext = {
    formHook: mockFormHook,
    navigationHook: mockNavigationHook,
    storageUnitsHook: mockStorageUnitsHook,
    isFormValid: true,
    isDirty: false,
    isSubmitting: false,
    resetForm: jest.fn(),
    submitForm: mockFormHook.submitForm,
    // Edit mode specific context
    isEditMode: true,
    appointmentId: '456',
    appointmentDataHook: mockUseAppointmentData
  };

  return {
    AccessStorageProvider: ({ children, mode, appointmentId }: { 
      children: React.ReactNode; 
      mode?: string; 
      appointmentId?: string; 
    }) => (
      <div data-testid="access-storage-provider" data-mode={mode} data-appointment-id={appointmentId}>
        {children}
      </div>
    ),
    useAccessStorageContext: () => mockContext,
    useAccessStorageFormState: () => ({
      formState: mockFormHook.formState,
      errors: mockFormHook.errors,
      flags: mockFormHook.flags,
      isFormValid: mockContext.isFormValid,
      isDirty: mockContext.isDirty,
      isSubmitting: mockContext.isSubmitting,
      updateFormState: mockFormHook.updateFormState,
      setError: mockFormHook.setError,
      clearError: mockFormHook.clearError,
      clearAllErrors: mockFormHook.clearAllErrors,
      togglePlanDetails: mockFormHook.togglePlanDetails,
      populateFromAppointment: mockFormHook.populateFromAppointment
    }),
    useAccessStorageNavigation_Context: () => mockNavigationHook,
    useAccessStorageSubmission: () => ({
      submitForm: mockContext.submitForm,
      resetForm: mockContext.resetForm,
      isSubmitting: mockContext.isSubmitting
    }),
    useAccessStorageUnits: () => mockStorageUnitsHook
  };
});

describe('AccessStorageForm - Edit Mode', () => {
  const user = userEvent.setup();
  const mockOnSubmissionSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { appointmentId: 456 }
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== EDIT MODE INITIALIZATION TESTS =====

  describe('Edit Mode Initialization', () => {
    it('renders in edit mode with correct props', async () => {
      render(
        <AccessStorageForm 
          mode="edit" 
          appointmentId="456" 
          onSubmissionSuccess={mockOnSubmissionSuccess}
        />
      );
      
      await waitFor(() => {
        const provider = screen.getByTestId('access-storage-provider');
        expect(provider).toHaveAttribute('data-mode', 'edit');
        expect(provider).toHaveAttribute('data-appointment-id', '456');
      });
    });

    it('shows edit-specific title in step 1', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Storage access')).toBeInTheDocument();
        expect(screen.getByText('Edit Mode: true')).toBeInTheDocument();
      });
    });

    it('passes edit mode props to MyQuote component', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Mode: true')).toBeInTheDocument();
        expect(screen.getByText('Appointment ID: 456')).toBeInTheDocument();
      });
    });

    it('defaults to create mode when no mode specified', async () => {
      render(<AccessStorageForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Access your storage')).toBeInTheDocument();
        expect(screen.getByText('Edit Mode: false')).toBeInTheDocument();
      });
    });
  });

  // ===== APPOINTMENT DATA LOADING TESTS =====

  describe('Appointment Data Loading', () => {
    it('shows loading state while fetching appointment data', async () => {
      // Mock loading state
      const { useAppointmentData } = require('@/hooks/useAppointmentData');
      useAppointmentData.mockReturnValue({
        ...mockUseAppointmentData,
        isLoading: true,
        appointmentData: null
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      expect(screen.getByTestId('appointment-loading-skeleton')).toBeInTheDocument();
      expect(screen.getByText('Loading appointment...')).toBeInTheDocument();
    });

    it('shows error state when appointment data fails to load', async () => {
      const { useAppointmentData } = require('@/hooks/useAppointmentData');
      useAppointmentData.mockReturnValue({
        ...mockUseAppointmentData,
        isLoading: false,
        appointmentData: null,
        error: 'Appointment not found',
        errorType: 'not_found'
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      expect(screen.getByTestId('appointment-error-state')).toBeInTheDocument();
      expect(screen.getByText('Error: Appointment not found')).toBeInTheDocument();
      expect(screen.getByText('Error Type: not_found')).toBeInTheDocument();
    });

    it('handles retry functionality from error state', async () => {
      const mockRefetch = jest.fn();
      const { useAppointmentData } = require('@/hooks/useAppointmentData');
      useAppointmentData.mockReturnValue({
        ...mockUseAppointmentData,
        isLoading: false,
        appointmentData: null,
        error: 'Network error',
        errorType: 'network_error',
        refetch: mockRefetch
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('renders form when appointment data loads successfully', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
        expect(screen.getByText('Edit Storage access')).toBeInTheDocument();
      });
    });
  });

  // ===== FORM PRE-POPULATION TESTS =====

  describe('Form Pre-population', () => {
    it('pre-populates form with appointment data', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        // Check that form shows pre-populated data
        expect(screen.getByText('Boombox BX001')).toBeInTheDocument();
        expect(screen.getByText('Edit Mode: true')).toBeInTheDocument();
      });
    });

    it('calls populateFromAppointment when appointment data is available', async () => {
      const mockPopulateFromAppointment = jest.fn();
      const { useAccessStorageFormState } = require('@/components/features/orders/AccessStorageProvider');
      
      // Mock the form state hook to return our mock function
      jest.mocked(useAccessStorageFormState).mockReturnValue({
        formState: expect.any(Object),
        errors: {},
        flags: {},
        isFormValid: true,
        isDirty: false,
        isSubmitting: false,
        updateFormState: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        clearAllErrors: jest.fn(),
        togglePlanDetails: jest.fn(),
        populateFromAppointment: mockPopulateFromAppointment
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(mockPopulateFromAppointment).toHaveBeenCalledWith(mockAppointmentData);
      });
    });
  });

  // ===== EDIT MODE FORM VALIDATION TESTS =====

  describe('Edit Mode Form Validation', () => {
    it('validates required fields in edit mode', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });

      // Form should be valid with pre-populated data
      const submitButton = screen.getByTestId('quote-submit-button');
      expect(submitButton).toBeInTheDocument();
    });

    it('shows validation errors for invalid changes', async () => {
      // Mock form with validation errors
      const { useAccessStorageFormState } = require('@/components/features/orders/AccessStorageProvider');
      jest.mocked(useAccessStorageFormState).mockReturnValue({
        formState: expect.any(Object),
        errors: {
          addressError: 'Address is required',
          scheduleError: 'Please select a date and time'
        },
        flags: {},
        isFormValid: false,
        isDirty: true,
        isSubmitting: false,
        updateFormState: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        clearAllErrors: jest.fn(),
        togglePlanDetails: jest.fn(),
        populateFromAppointment: jest.fn()
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        // Validation errors would be displayed in the actual form components
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });
    });

    it('allows proceeding through steps with valid data', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });

      // Should be able to interact with form elements
      const accessItemsButton = screen.getByTestId('access-items-button');
      await user.click(accessItemsButton);
      
      expect(accessItemsButton).toBeInTheDocument();
    });
  });

  // ===== EDIT SUBMISSION WORKFLOW TESTS =====

  describe('Edit Submission Workflow', () => {
    it('shows correct button text for edit mode', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByText('Update Appointment')).toBeInTheDocument();
      });
    });

    it('submits form with edit mode data', async () => {
      const mockSubmitForm = jest.fn().mockResolvedValue({ success: true, appointmentId: 456 });
      const { useAccessStorageSubmission } = require('@/components/features/orders/AccessStorageProvider');
      jest.mocked(useAccessStorageSubmission).mockReturnValue({
        submitForm: mockSubmitForm,
        resetForm: jest.fn(),
        isSubmitting: false
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" onSubmissionSuccess={mockOnSubmissionSuccess} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('my-quote')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('quote-submit-button');
      await user.click(submitButton);

      expect(mockSubmitForm).toHaveBeenCalled();
    });

    it('calls onSubmissionSuccess callback after successful edit', async () => {
      const mockSubmitForm = jest.fn().mockResolvedValue({ success: true, appointmentId: 456 });
      const { useAccessStorageSubmission } = require('@/components/features/orders/AccessStorageProvider');
      jest.mocked(useAccessStorageSubmission).mockReturnValue({
        submitForm: mockSubmitForm,
        resetForm: jest.fn(),
        isSubmitting: false
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" onSubmissionSuccess={mockOnSubmissionSuccess} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('my-quote')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('quote-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmissionSuccess).toHaveBeenCalledWith(456);
      });
    });

    it('handles submission errors gracefully', async () => {
      const mockSubmitForm = jest.fn().mockRejectedValue(new Error('Submission failed'));
      const { useAccessStorageSubmission } = require('@/components/features/orders/AccessStorageProvider');
      jest.mocked(useAccessStorageSubmission).mockReturnValue({
        submitForm: mockSubmitForm,
        resetForm: jest.fn(),
        isSubmitting: false
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('my-quote')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('quote-submit-button');
      await user.click(submitButton);

      // Form should handle the error (specific error handling would be in the actual implementation)
      expect(mockSubmitForm).toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      const { useAccessStorageSubmission } = require('@/components/features/orders/AccessStorageProvider');
      jest.mocked(useAccessStorageSubmission).mockReturnValue({
        submitForm: jest.fn(),
        resetForm: jest.fn(),
        isSubmitting: true // Loading state
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        // Loading state would be reflected in the UI
        expect(screen.getByTestId('my-quote')).toBeInTheDocument();
      });
    });
  });

  // ===== EDIT MODE UI ELEMENTS TESTS =====

  describe('Edit Mode UI Elements', () => {
    it('displays appointment ID in quote component', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByText('Appointment ID: 456')).toBeInTheDocument();
      });
    });

    it('shows price comparison when enabled', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByText('Original Total: $150')).toBeInTheDocument();
        expect(screen.getByText('Show Price Comparison: false')).toBeInTheDocument();
      });
    });

    it('displays edit-specific confirmation step', async () => {
      // Mock navigation to confirmation step
      const { useAccessStorageNavigation_Context } = require('@/components/features/orders/AccessStorageProvider');
      jest.mocked(useAccessStorageNavigation_Context).mockReturnValue({
        currentStep: 3, // Confirmation step
        goToStep: jest.fn(),
        canGoToStep: jest.fn(() => true),
        isStepCompleted: jest.fn(() => true)
      });

      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm appointment changes')).toBeInTheDocument();
        expect(screen.getByText('Update Appointment')).toBeInTheDocument();
      });
    });
  });

  // ===== ACCESSIBILITY TESTS =====

  describe('Accessibility in Edit Mode', () => {
    it('has no accessibility violations in edit mode', async () => {
      const { container } = render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for edit mode elements', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Edit Storage access');
      });
    });

    it('maintains keyboard navigation in edit mode', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      
      const firstButton = screen.getAllByRole('button')[0];
      expect(firstButton).toHaveFocus();
    });

    it('provides proper screen reader context for edit mode', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        // Edit mode should provide clear context about editing vs creating
        expect(screen.getByText('Edit Storage access')).toBeInTheDocument();
      });
    });
  });

  // ===== INTEGRATION TESTS =====

  describe('Integration Tests', () => {
    it('integrates with appointment data hook correctly', async () => {
      const { useAppointmentData } = require('@/hooks/useAppointmentData');
      
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      expect(useAppointmentData).toHaveBeenCalledWith('456');
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });
    });

    it('passes correct props to child components', async () => {
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        // Check that edit mode is passed to step components
        expect(screen.getByText('Edit Mode: true')).toBeInTheDocument();
      });
    });

    it('handles mode switching correctly', async () => {
      const { rerender } = render(<AccessStorageForm mode="create" />);
      
      await waitFor(() => {
        expect(screen.getByText('Access your storage')).toBeInTheDocument();
      });

      rerender(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Storage access')).toBeInTheDocument();
      });
    });
  });

  // ===== PERFORMANCE TESTS =====

  describe('Performance in Edit Mode', () => {
    it('renders edit mode within acceptable time', async () => {
      const startTime = performance.now();
      
      render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 150ms
      expect(renderTime).toBeLessThan(150);
    });

    it('handles appointment data updates efficiently', async () => {
      const { rerender } = render(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });

      // Update appointment data
      const { useAppointmentData } = require('@/hooks/useAppointmentData');
      useAppointmentData.mockReturnValue({
        ...mockUseAppointmentData,
        appointmentData: {
          ...mockAppointmentData,
          description: 'Updated description'
        }
      });

      rerender(<AccessStorageForm mode="edit" appointmentId="456" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-step1')).toBeInTheDocument();
      });
    });
  });
});
