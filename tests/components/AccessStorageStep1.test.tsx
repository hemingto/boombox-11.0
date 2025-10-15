/**
 * @fileoverview Tests for AccessStorageStep1 Component
 * Following boombox-11.0 testing standards with comprehensive accessibility and integration testing
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessStorageStep1 from '@/components/features/orders/AccessStorageStep1';
import { AccessStorageProvider } from '@/components/features/orders/AccessStorageProvider';
import { DeliveryReason, PlanType } from '@/types/accessStorage.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/access-storage',
    query: {},
    asPath: '/access-storage'
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
    getAll: jest.fn(() => []),
    keys: jest.fn(() => []),
    values: jest.fn(() => []),
    entries: jest.fn(() => []),
    forEach: jest.fn(),
    toString: jest.fn(() => '')
  })),
  usePathname: jest.fn(() => '/access-storage')
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }
    },
    status: 'authenticated'
  }))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock the form components
jest.mock('@/components/forms', () => ({
  YesOrNoRadio: ({ value, onChange, yesLabel, noLabel, hasError, errorMessage, name, ...props }: any) => (
    <div data-testid="yes-no-radio" {...props}>
      <button 
        onClick={() => onChange(DeliveryReason.ACCESS_ITEMS)}
        aria-pressed={value === DeliveryReason.ACCESS_ITEMS}
      >
        {yesLabel}
      </button>
      <button 
        onClick={() => onChange(DeliveryReason.END_STORAGE_TERM)}
        aria-pressed={value === DeliveryReason.END_STORAGE_TERM}
      >
        {noLabel}
      </button>
      {hasError && <div role="alert">{errorMessage}</div>}
    </div>
  ),
  AddressInput: ({ value, onAddressChange, hasError, onClearError, ...props }: any) => (
    <div data-testid="address-input" {...props}>
      <input
        value={value}
        onChange={(e) => onAddressChange(e.target.value, '12345', { lat: 37.7749, lng: -122.4194 }, 'San Francisco')}
        placeholder="Enter address"
      />
      {hasError && <div role="alert">Address error</div>}
    </div>
  ),
  StorageUnitCheckboxList: ({ storageUnits, onSelectionChange, selectedIds, hasError, disabled, ...props }: any) => (
    <div data-testid="storage-unit-list" {...props}>
      {storageUnits.map((unit: any) => (
        <label key={unit.id}>
          <input
            type="checkbox"
            checked={selectedIds.includes(unit.id)}
            disabled={disabled}
            onChange={(e) => {
              const newSelection = e.target.checked 
                ? [...selectedIds, unit.id]
                : selectedIds.filter((id: string) => id !== unit.id);
              onSelectionChange(newSelection);
            }}
          />
          {unit.title}
        </label>
      ))}
      {hasError && <div role="alert">Storage unit error</div>}
    </div>
  ),
  LaborHelpDropdown: ({ value, onLaborChange, hasError, ...props }: any) => (
    <div data-testid="labor-help-dropdown" {...props}>
      <select
        value={value}
        aria-label="Select labor plan"
        onChange={(e) => {
          const selectedOption = e.target.options[e.target.selectedIndex];
          const optionText = selectedOption.text;
          onLaborChange(e.target.value, optionText, 'description');
        }}
      >
        <option value="">Select plan</option>
        <option value="option1">Do It Yourself Plan</option>
        <option value="option2">Full Service Plan</option>
      </select>
      {hasError && <div role="alert">Labor help error</div>}
    </div>
  ),
  LaborPlanDetails: () => <div data-testid="labor-plan-details">Plan details content</div>
}));

// Mock storage units data
const mockStorageUnits = [
  {
    id: '1',
    imageSrc: '/img/unit1.jpg',
    title: 'Boombox 001',
    pickUpDate: '2024-01-15',
    lastAccessedDate: '2024-01-20',
    description: 'Storage unit 1'
  },
  {
    id: '2',
    imageSrc: '/img/unit2.jpg',
    title: 'Boombox 002',
    pickUpDate: '2024-01-10',
    lastAccessedDate: '2024-01-18',
    description: 'Storage unit 2'
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AccessStorageProvider enablePersistence={false}>
    {children}
  </AccessStorageProvider>
);

// Mock the provider hooks
const mockHooks = {
  useDeliveryReasonField: jest.fn(),
  useAddressField: jest.fn(),
  useStorageUnitSelectionField: jest.fn(),
  usePlanSelectionField: jest.fn(),
  useAccessStorageUnits: jest.fn(),
  useAccessStorageFormState: jest.fn()
};

jest.mock('@/components/features/orders/AccessStorageProvider', () => ({
  ...jest.requireActual('@/components/features/orders/AccessStorageProvider'),
  useDeliveryReasonField: () => mockHooks.useDeliveryReasonField(),
  useAddressField: () => mockHooks.useAddressField(),
  useStorageUnitSelectionField: () => mockHooks.useStorageUnitSelectionField(),
  usePlanSelectionField: () => mockHooks.usePlanSelectionField(),
  useAccessStorageUnits: () => mockHooks.useAccessStorageUnits(),
  useAccessStorageFormState: () => mockHooks.useAccessStorageFormState()
}));

describe('AccessStorageStep1', () => {
  const user = userEvent.setup();

  // Default mock implementations
  beforeEach(() => {
    mockHooks.useDeliveryReasonField.mockReturnValue({
      value: null,
      onChange: jest.fn(),
      error: null
    });

    mockHooks.useAddressField.mockReturnValue({
      value: '',
      onChange: jest.fn(),
      clearError: jest.fn(),
      error: null
    });

    mockHooks.useStorageUnitSelectionField.mockReturnValue({
      selectedIds: [],
      onChange: jest.fn(),
      clearError: jest.fn(),
      error: null
    });

    mockHooks.usePlanSelectionField.mockReturnValue({
      selectedPlan: '',
      selectedPlanName: '',
      planType: '',
      onChange: jest.fn(),
      clearError: jest.fn(),
      error: null
    });

    mockHooks.useAccessStorageUnits.mockReturnValue({
      storageUnits: mockStorageUnits,
      isLoading: false,
      error: null
    });

    mockHooks.useAccessStorageFormState.mockReturnValue({
      formState: {
        isPlanDetailsVisible: false,
        contentHeight: 0
      },
      togglePlanDetails: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== BASIC RENDERING TESTS =====
  
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Access your storage')).toBeInTheDocument();
    });

    it('renders all form sections', () => {
      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      // Check all section headings
      expect(screen.getByText("What's the purpose of your delivery?")).toBeInTheDocument();
      expect(screen.getByText('Where are we delivering your Boombox?')).toBeInTheDocument();
      expect(screen.getByText('Which storage units do you need delivered?')).toBeInTheDocument();
      expect(screen.getByText('Do you need help unloading your Boombox?')).toBeInTheDocument();
    });

    it('renders form components with correct props', () => {
      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByTestId('yes-no-radio')).toBeInTheDocument();
      expect(screen.getByTestId('address-input')).toBeInTheDocument();
      expect(screen.getByTestId('storage-unit-list')).toBeInTheDocument();
      expect(screen.getByTestId('labor-help-dropdown')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          // Disable the banner landmark rule for testing since we're not testing the full page layout
          'landmark-banner-is-top-level': { enabled: false }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('has proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toHaveTextContent('Access your storage');
      expect(h2Elements).toHaveLength(4);
    });

    it('has proper ARIA labels and relationships', () => {
      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-labelledby', 'step1-title');

      const sections = screen.getAllByRole('region', { hidden: true });
      sections.forEach(section => {
        expect(section).toHaveAttribute('aria-labelledby');
      });
    });

    it('provides helpful descriptions for form fields', () => {
      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByText('Start typing your address and select from the dropdown options')).toBeInTheDocument();
      expect(screen.getByText('Select the units you need delivered to your address')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred unloading assistance level')).toBeInTheDocument();
    });
  });

  // ===== DELIVERY REASON LOGIC TESTS =====
  
  describe('Delivery Reason Logic', () => {
    it('handles delivery reason change correctly', async () => {
      const mockOnChange = jest.fn();
      mockHooks.useDeliveryReasonField.mockReturnValue({
        value: null,
        onChange: mockOnChange,
        error: null
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const accessItemsButton = screen.getByText('Access items');
      await user.click(accessItemsButton);

      expect(mockOnChange).toHaveBeenCalledWith(DeliveryReason.ACCESS_ITEMS);
    });

    it('auto-selects all units when ending storage term', async () => {
      const mockStorageUnitOnChange = jest.fn();
      const mockDeliveryReasonOnChange = jest.fn();

      mockHooks.useDeliveryReasonField.mockReturnValue({
        value: null,
        onChange: mockDeliveryReasonOnChange,
        error: null
      });

      mockHooks.useStorageUnitSelectionField.mockReturnValue({
        selectedIds: [],
        onChange: mockStorageUnitOnChange,
        clearError: jest.fn(),
        error: null
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const endStorageButton = screen.getByText('End storage term');
      await user.click(endStorageButton);

      expect(mockDeliveryReasonOnChange).toHaveBeenCalledWith(DeliveryReason.END_STORAGE_TERM);
      expect(mockStorageUnitOnChange).toHaveBeenCalledWith(['1', '2']);
    });

    it('shows appropriate help text for end storage term', () => {
      mockHooks.useDeliveryReasonField.mockReturnValue({
        value: DeliveryReason.END_STORAGE_TERM,
        onChange: jest.fn(),
        error: null
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByText('All units are automatically selected when ending your storage term')).toBeInTheDocument();
    });
  });

  // ===== LOADING STATES TESTS =====
  
  describe('Loading States', () => {
    it('shows loading skeletons when storage units are loading', () => {
      mockHooks.useAccessStorageUnits.mockReturnValue({
        storageUnits: [],
        isLoading: true,
        error: null
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByRole('status', { name: 'Loading storage units' })).toBeInTheDocument();
      expect(screen.getByText('Loading your storage units...')).toBeInTheDocument();
      
      // Check for skeleton elements by class
      const container = screen.getByRole('status', { name: 'Loading storage units' });
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows storage units when loading is complete', () => {
      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByTestId('storage-unit-list')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  // ===== ERROR HANDLING TESTS =====
  
  describe('Error Handling', () => {
    it('displays delivery reason error', () => {
      mockHooks.useDeliveryReasonField.mockReturnValue({
        value: null,
        onChange: jest.fn(),
        error: 'Please select a delivery reason'
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getAllByText('Please select a delivery reason')).toHaveLength(2);
    });

    it('displays address error', () => {
      mockHooks.useAddressField.mockReturnValue({
        value: '',
        onChange: jest.fn(),
        clearError: jest.fn(),
        error: 'Address is required'
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByText('Address is required')).toBeInTheDocument();
    });

    it('displays storage units error', () => {
      mockHooks.useAccessStorageUnits.mockReturnValue({
        storageUnits: [],
        isLoading: false,
        error: 'Failed to load storage units'
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      expect(screen.getByText('Failed to load storage units. Please refresh the page and try again.')).toBeInTheDocument();
    });
  });

  // ===== PLAN DETAILS ACCORDION TESTS =====
  
  describe('Plan Details Accordion', () => {
    it('toggles plan details visibility', async () => {
      const mockTogglePlanDetails = jest.fn();
      
      mockHooks.useAccessStorageFormState.mockReturnValue({
        formState: {
          isPlanDetailsVisible: false,
          contentHeight: 0
        },
        togglePlanDetails: mockTogglePlanDetails
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', { name: 'Show plan details' });
      await user.click(toggleButton);

      expect(mockTogglePlanDetails).toHaveBeenCalled();
    });

    it('shows plan details when expanded', () => {
      mockHooks.useAccessStorageFormState.mockReturnValue({
        formState: {
          isPlanDetailsVisible: true,
          contentHeight: 200
        },
        togglePlanDetails: jest.fn()
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const planDetails = screen.getByTestId('labor-plan-details');
      expect(planDetails).toBeInTheDocument();
      
      const toggleButton = screen.getByRole('button', { name: 'Hide plan details' });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ===== PLAN SELECTION LOGIC TESTS =====
  
  describe('Plan Selection Logic', () => {
    it('handles DIY plan selection correctly', async () => {
      const mockOnChange = jest.fn();

      mockHooks.usePlanSelectionField.mockReturnValue({
        selectedPlan: '',
        selectedPlanName: '',
        planType: '',
        onChange: mockOnChange,
        clearError: jest.fn(),
        error: null
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option1');

      expect(mockOnChange).toHaveBeenCalledWith('option1', 'Do It Yourself Plan', 'description');
    });

    it('handles Full Service plan selection correctly', async () => {
      const mockOnChange = jest.fn();

      mockHooks.usePlanSelectionField.mockReturnValue({
        selectedPlan: '',
        selectedPlanName: '',
        planType: '',
        onChange: mockOnChange,
        clearError: jest.fn(),
        error: null
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option2');

      expect(mockOnChange).toHaveBeenCalledWith('option2', 'Full Service Plan', 'description');
    });
  });

  // ===== INTEGRATION TESTS =====
  
  describe('Integration Tests', () => {
    it('handles complete form interaction flow', async () => {
      const mockDeliveryReasonOnChange = jest.fn();
      const mockAddressOnChange = jest.fn();
      const mockStorageUnitOnChange = jest.fn();
      const mockPlanOnChange = jest.fn();

      mockHooks.useDeliveryReasonField.mockReturnValue({
        value: null,
        onChange: mockDeliveryReasonOnChange,
        error: null
      });

      mockHooks.useAddressField.mockReturnValue({
        value: '',
        onChange: mockAddressOnChange,
        clearError: jest.fn(),
        error: null
      });

      mockHooks.useStorageUnitSelectionField.mockReturnValue({
        selectedIds: [],
        onChange: mockStorageUnitOnChange,
        clearError: jest.fn(),
        error: null
      });

      mockHooks.usePlanSelectionField.mockReturnValue({
        selectedPlan: '',
        selectedPlanName: '',
        planType: '',
        onChange: mockPlanOnChange,
        clearError: jest.fn(),
        error: null
      });

      render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      // Step 1: Select delivery reason
      await user.click(screen.getByText('Access items'));
      expect(mockDeliveryReasonOnChange).toHaveBeenCalledWith(DeliveryReason.ACCESS_ITEMS);

      // Step 2: Enter address
      const addressInput = screen.getByPlaceholderText('Enter address');
      await user.type(addressInput, '123 Main St');
      expect(mockAddressOnChange).toHaveBeenCalled();

      // Step 3: Select storage units
      const firstUnit = screen.getByLabelText('Boombox 001');
      await user.click(firstUnit);
      expect(mockStorageUnitOnChange).toHaveBeenCalledWith(['1']);

      // Step 4: Select plan
      const planSelect = screen.getByRole('combobox');
      await user.selectOptions(planSelect, 'option1');
      expect(mockPlanOnChange).toHaveBeenCalledWith('option1', 'Do It Yourself Plan', 'description');
    });
  });

  // ===== PERFORMANCE TESTS =====
  
  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      // Re-render with same props
      rerender(
        <TestWrapper>
          <AccessStorageStep1 />
        </TestWrapper>
      );

      // Component should handle re-renders gracefully
      expect(screen.getByText('Access your storage')).toBeInTheDocument();
    });
  });
});
