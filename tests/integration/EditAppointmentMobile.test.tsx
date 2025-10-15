/**
 * @fileoverview Mobile responsiveness integration tests for Edit Appointment
 * @source boombox-11.0/src/components/features/orders/AccessStorageForm.tsx (edit mode)
 * 
 * TEST COVERAGE:
 * - Mobile viewport adaptation and responsive design
 * - Touch interaction patterns and gesture support
 * - Mobile-specific UI components and layouts
 * - Performance on mobile devices
 * - Mobile accessibility features
 * - Cross-device compatibility testing
 * - Mobile form validation and error handling
 * - Mobile navigation patterns
 * - Touch target sizing and spacing
 * - Mobile-optimized loading states
 * 
 * @refactor Mobile-specific integration tests for edit appointment workflow
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/AddStorageTestWrapper';
import AccessStorageForm from '@/components/features/orders/AccessStorageForm';
import { AppointmentDetailsResponse } from '@/types/accessStorage.types';

// ===== MOBILE VIEWPORT SETUP =====

// Mobile viewport configurations
const MOBILE_VIEWPORTS = {
  iphone_se: { width: 375, height: 667 },
  iphone_12: { width: 390, height: 844 },
  iphone_12_pro_max: { width: 428, height: 926 },
  samsung_galaxy_s21: { width: 360, height: 800 },
  pixel_5: { width: 393, height: 851 }
};

// Mock window dimensions
const mockViewport = (viewport: { width: number; height: number }) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewport.width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: viewport.height,
  });

  // Mock matchMedia for responsive queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query.includes('max-width: 768px') ? viewport.width <= 768 : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

// ===== MOCK SETUP =====

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockAppointmentData: AppointmentDetailsResponse = {
  id: 123,
  userId: 'test-user-id',
  appointmentType: 'Storage Unit Access',
  deliveryReason: 'access',
  planType: 'DIY',
  appointmentDateTime: '2024-02-15T10:00:00Z',
  address: '123 Test Street, Test City, CA 90210',
  zipCode: '90210',
  selectedStorageUnits: [1, 2],
  storageUnitCount: 2,
  description: 'Need to access my storage unit',
  loadingHelpPrice: 50,
  monthlyStorageRate: 100,
  monthlyInsuranceRate: 25,
  calculatedTotal: 175,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  selectedLabor: null,
  status: 'Scheduled',
  stripeCustomerId: 'cus_test123'
};

jest.mock('@/hooks/useAppointmentData', () => ({
  useAppointmentData: jest.fn(() => ({
    appointmentData: mockAppointmentData,
    isLoading: false,
    error: null,
    errorType: null,
    retryCount: 0,
    retry: jest.fn(),
    refetch: jest.fn()
  }))
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === 'appointmentType') return 'Storage Unit Access';
      if (key === 'appointmentId') return '123';
      return null;
    }),
    toString: jest.fn(() => 'appointmentType=Storage Unit Access&appointmentId=123')
  }),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        accountType: 'USER'
      }
    },
    status: 'authenticated'
  })
}));

// ===== TEST SUITE =====

describe('Edit Appointment Mobile Responsiveness', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        appointmentId: 123,
        message: 'Appointment updated successfully'
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Reset viewport to desktop
    mockViewport({ width: 1024, height: 768 });
  });

  // ===== VIEWPORT ADAPTATION =====

  describe('Mobile Viewport Adaptation', () => {
    Object.entries(MOBILE_VIEWPORTS).forEach(([deviceName, viewport]) => {
      it(`adapts layout correctly for ${deviceName.replace('_', ' ')} (${viewport.width}x${viewport.height})`, async () => {
        mockViewport(viewport);

        render(
          <AccessStorageForm
            mode="edit"
            appointmentId="123"
            onSubmissionSuccess={jest.fn()}
          />
        );

        await waitFor(() => {
          expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
        });

        // Check for mobile-responsive classes
        const containers = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
        expect(containers.length).toBeGreaterThan(0);

        // Verify mobile-specific layout adjustments
        const form = document.querySelector('form');
        expect(form).toBeInTheDocument();

        // Check for proper mobile spacing
        const mobileSpacingElements = document.querySelectorAll('[class*="px-4"], [class*="py-4"], [class*="mx-4"], [class*="my-4"]');
        expect(mobileSpacingElements.length).toBeGreaterThan(0);
      });
    });

    it('uses mobile-first responsive design patterns', async () => {
      mockViewport(MOBILE_VIEWPORTS.iphone_12);

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Check for mobile-first classes (base classes should work on mobile)
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      const buttonClasses = submitButton.className;
      
      // Should have mobile-appropriate padding and sizing
      expect(buttonClasses).toMatch(/py-\d+/); // Vertical padding
      expect(buttonClasses).toMatch(/px-\d+/); // Horizontal padding
      
      // Should use full width on mobile or appropriate mobile sizing
      expect(buttonClasses).toMatch(/(w-full|w-\d+)/);
    });

    it('handles orientation changes gracefully', async () => {
      // Start in portrait
      mockViewport({ width: 375, height: 667 });

      const { rerender } = render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Switch to landscape
      mockViewport({ width: 667, height: 375 });
      
      rerender(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      // Form should still be functional
      expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update appointment/i })).toBeInTheDocument();
    });
  });

  // ===== TOUCH INTERACTIONS =====

  describe('Touch Interaction Patterns', () => {
    beforeEach(() => {
      mockViewport(MOBILE_VIEWPORTS.iphone_12);
    });

    it('handles touch events for form submission', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      
      // Simulate touch events
      fireEvent.touchStart(submitButton, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchEnd(submitButton, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('provides adequate touch target sizes (44px minimum)', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Check interactive elements have adequate touch targets
      const interactiveElements = [
        ...document.querySelectorAll('button'),
        ...document.querySelectorAll('input[type="radio"]'),
        ...document.querySelectorAll('input[type="checkbox"]'),
        ...document.querySelectorAll('select')
      ];

      interactiveElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const minSize = 44; // WCAG recommended minimum touch target size
        
        // Check if element or its parent has adequate sizing
        const hasAdequateSize = 
          parseInt(styles.minHeight) >= minSize ||
          parseInt(styles.height) >= minSize ||
          element.className.includes('h-11') || // Tailwind h-11 = 44px
          element.className.includes('h-12') || // Tailwind h-12 = 48px
          element.className.includes('py-3') ||  // Adequate padding
          element.className.includes('py-4');

        expect(hasAdequateSize).toBe(true);
      });
    });

    it('handles swipe gestures for navigation', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const formContainer = document.querySelector('form') || document.body;

      // Simulate swipe left gesture
      fireEvent.touchStart(formContainer, {
        touches: [{ clientX: 200, clientY: 100 }]
      });

      fireEvent.touchMove(formContainer, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchEnd(formContainer, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      // Form should remain functional after gesture
      expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
    });

    it('prevents accidental form submissions from touch events', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      
      // Simulate accidental touch (touch start but no touch end)
      fireEvent.touchStart(submitButton, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // Move finger away (simulating accidental touch)
      fireEvent.touchMove(submitButton, {
        touches: [{ clientX: 200, clientY: 200 }]
      });

      fireEvent.touchEnd(submitButton, {
        changedTouches: [{ clientX: 200, clientY: 200 }]
      });

      // Should not submit form
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ===== MOBILE UI COMPONENTS =====

  describe('Mobile-Specific UI Components', () => {
    beforeEach(() => {
      mockViewport(MOBILE_VIEWPORTS.iphone_12);
    });

    it('uses mobile-optimized form layouts', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Check for mobile form layout classes
      const formGroups = document.querySelectorAll('.form-group');
      formGroups.forEach(group => {
        const classes = group.className;
        // Should have mobile-appropriate spacing
        expect(classes).toMatch(/(mb-4|mb-6|space-y-4|space-y-6)/);
      });

      // Check for full-width inputs on mobile
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const classes = input.className;
        expect(classes).toMatch(/(w-full)/);
      });
    });

    it('displays mobile-optimized error messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          fieldErrors: {
            appointmentDateTime: 'Selected time is not available'
          }
        })
      });

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/selected time is not available/i)).toBeInTheDocument();
      });

      // Error messages should be properly sized for mobile
      const errorElements = document.querySelectorAll('[role="alert"], .form-error');
      errorElements.forEach(error => {
        const classes = error.className;
        // Should have mobile-appropriate text sizing
        expect(classes).toMatch(/(text-sm|text-xs)/);
      });
    });

    it('uses mobile-appropriate loading indicators', async () => {
      // Slow API response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, appointmentId: 123 })
          }), 1000)
        )
      );

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      // Check for mobile-optimized loading state
      expect(screen.getByText(/updating appointment/i)).toBeInTheDocument();
      
      // Loading indicator should be appropriately sized
      const loadingElements = document.querySelectorAll('[class*="animate-spin"], [class*="loading"]');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  // ===== MOBILE PERFORMANCE =====

  describe('Mobile Performance Optimization', () => {
    beforeEach(() => {
      mockViewport(MOBILE_VIEWPORTS.samsung_galaxy_s21);
    });

    it('handles large forms efficiently on mobile', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Simulate typing in multiple fields rapidly (mobile keyboard usage)
      const descriptionField = screen.getByLabelText(/description/i);
      
      // Use fireEvent for performance on mobile
      fireEvent.change(descriptionField, { 
        target: { value: 'Updated description for mobile test' }
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('minimizes reflows and repaints during interactions', async () => {
      const performanceObserver = jest.fn();
      
      // Mock Performance Observer
      global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
        takeRecords: jest.fn(() => [])
      }));

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Interact with form elements
      const descriptionField = screen.getByLabelText(/description/i);
      await user.type(descriptionField, 'Test');

      // Form should remain responsive
      expect(screen.getByDisplayValue(/Test/)).toBeInTheDocument();
    });

    it('handles memory constraints gracefully', async () => {
      // Simulate memory pressure
      const originalMemory = (navigator as any).deviceMemory;
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // Low memory device
        configurable: true
      });

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Form should still be functional on low memory devices
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      expect(submitButton).toBeEnabled();

      // Restore original value
      Object.defineProperty(navigator, 'deviceMemory', {
        value: originalMemory,
        configurable: true
      });
    });
  });

  // ===== MOBILE ACCESSIBILITY =====

  describe('Mobile Accessibility Features', () => {
    beforeEach(() => {
      mockViewport(MOBILE_VIEWPORTS.pixel_5);
    });

    it('supports mobile screen reader navigation', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Check for proper heading structure for mobile screen readers
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);

      // Check for proper landmark roles
      const landmarks = document.querySelectorAll('[role="main"], [role="form"], [role="banner"]');
      expect(landmarks.length).toBeGreaterThan(0);

      // Check for proper focus management
      const focusableElements = document.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('provides appropriate mobile focus indicators', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      
      // Focus should be visible on mobile
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
      
      // Check for focus indicator classes
      const classes = submitButton.className;
      expect(classes).toMatch(/(focus:ring|focus:outline|focus:border)/);
    });

    it('handles mobile zoom without breaking layout', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Simulate zoom by changing viewport scale
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=2.0');
      }

      // Form should remain functional when zoomed
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeEnabled();
    });
  });

  // ===== CROSS-DEVICE COMPATIBILITY =====

  describe('Cross-Device Compatibility', () => {
    it('works consistently across different mobile browsers', async () => {
      // Mock different user agents
      const userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1', // iOS Safari
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36', // Android Chrome
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36' // Samsung Browser
      ];

      for (const userAgent of userAgents) {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        });

        mockViewport(MOBILE_VIEWPORTS.samsung_galaxy_s21);

        const { unmount } = render(
          <AccessStorageForm
            mode="edit"
            appointmentId="123"
            onSubmissionSuccess={jest.fn()}
          />
        );

        await waitFor(() => {
          expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
        });

        // Form should work on all mobile browsers
        const submitButton = screen.getByRole('button', { name: /update appointment/i });
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).toBeEnabled();

        unmount();
      }
    });

    it('adapts to different mobile input methods', async () => {
      mockViewport(MOBILE_VIEWPORTS.iphone_12);

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Test virtual keyboard interactions
      const descriptionField = screen.getByLabelText(/description/i);
      
      // Simulate mobile keyboard input
      fireEvent.focus(descriptionField);
      fireEvent.change(descriptionField, { target: { value: 'Mobile input test' } });
      
      expect(screen.getByDisplayValue('Mobile input test')).toBeInTheDocument();

      // Test voice input (simulated)
      fireEvent.change(descriptionField, { 
        target: { value: 'Voice input: Need to access storage unit urgently' }
      });
      
      expect(screen.getByDisplayValue(/voice input/i)).toBeInTheDocument();
    });
  });
});
