/**
 * @fileoverview Tests for PaymentMethodDropdown component
 * Following boombox-11.0 testing standards
 * 
 * Updated for refactored component that wraps Select
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PaymentMethodDropdown } from '@/components/forms/PaymentMethodDropdown';

expect.extend(toHaveNoViolations);

// Mock card brand icons
jest.mock('@/components/icons/VisaIcon', () => ({
  VisaIcon: () => <div data-testid="visa-icon">Visa</div>
}));

jest.mock('@/components/icons/MastercardIcon', () => ({
  MastercardIcon: () => <div data-testid="mastercard-icon">Mastercard</div>
}));

jest.mock('@/components/icons/AmexIcon', () => ({
  AmexIcon: () => <div data-testid="amex-icon">Amex</div>
}));

jest.mock('@/components/icons/DiscoverIcon', () => ({
  DiscoverIcon: () => <div data-testid="discover-icon">Discover</div>
}));

jest.mock('@/components/icons/JsbIcon', () => ({
  JcbIcon: () => <div data-testid="jcb-icon">JCB</div>
}));

jest.mock('@/components/icons/AppleIcon', () => ({
  AppleIcon: () => <div data-testid="apple-icon">Apple Pay</div>
}));

jest.mock('@/components/icons/AmazonPayIcon', () => ({
  AmazonPayIcon: () => <div data-testid="amazon-icon">Amazon Pay</div>
}));

describe('PaymentMethodDropdown', () => {
  const mockOptions = [
    {
      value: 'card_visa123',
      display: 'Visa ending in 1234',
      brand: 'visa'
    },
    {
      value: 'card_mc456',
      display: 'Mastercard ending in 5678',
      brand: 'mastercard'
    },
    {
      value: 'add_new',
      display: 'Add new payment method',
      isAddNew: true
    }
  ];

  const defaultProps = {
    options: mockOptions,
    onOptionChange: jest.fn(),
    value: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PaymentMethodDropdown {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays placeholder text when no option is selected', () => {
      render(<PaymentMethodDropdown {...defaultProps} label="Choose payment" />);
      expect(screen.getByText('Choose payment')).toBeInTheDocument();
    });

    it('displays selected option text when value is provided', () => {
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      // Query within the combobox to avoid the hidden select element
      const combobox = screen.getByRole('combobox');
      expect(within(combobox).getByText('Visa ending in 1234')).toBeInTheDocument();
    });

    it('shows dropdown chevron icon', () => {
      const { container } = render(<PaymentMethodDropdown {...defaultProps} />);
      const chevron = container.querySelector('svg.w-6.h-6');
      expect(chevron).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PaymentMethodDropdown {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with error state', async () => {
      const { container } = render(
        <PaymentMethodDropdown
          {...defaultProps}
          hasError={true}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<PaymentMethodDropdown {...defaultProps} label="Select card" />);
      const combobox = screen.getByRole('combobox');
      
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      const combobox = screen.getByRole('combobox');
      
      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Card Brand Icons', () => {
    it('displays Visa icon for visa brand', () => {
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      expect(screen.getByTestId('visa-icon')).toBeInTheDocument();
    });

    it('displays Mastercard icon for mastercard brand', () => {
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_mc456"
        />
      );
      expect(screen.getByTestId('mastercard-icon')).toBeInTheDocument();
    });

    it('displays appropriate icons in dropdown options', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByTestId('visa-icon')).toBeInTheDocument();
      expect(within(listbox).getByTestId('mastercard-icon')).toBeInTheDocument();
    });

    it('handles all card brands correctly', async () => {
      const allBrandOptions = [
        { value: 'visa', display: 'Visa', brand: 'visa' },
        { value: 'mastercard', display: 'Mastercard', brand: 'mastercard' },
        { value: 'amex', display: 'Amex', brand: 'amex' },
        { value: 'discover', display: 'Discover', brand: 'discover' },
        { value: 'jcb', display: 'JCB', brand: 'jcb' },
        { value: 'apple', display: 'Apple Pay', brand: 'apple_pay' },
        { value: 'amazon', display: 'Amazon Pay', brand: 'amazon_pay' }
      ];

      const user = userEvent.setup();
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          options={allBrandOptions}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByTestId('visa-icon')).toBeInTheDocument();
      expect(within(listbox).getByTestId('mastercard-icon')).toBeInTheDocument();
      expect(within(listbox).getByTestId('amex-icon')).toBeInTheDocument();
      expect(within(listbox).getByTestId('discover-icon')).toBeInTheDocument();
      expect(within(listbox).getByTestId('jcb-icon')).toBeInTheDocument();
      expect(within(listbox).getByTestId('apple-icon')).toBeInTheDocument();
      expect(within(listbox).getByTestId('amazon-icon')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown after selecting an option', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          onOptionChange={mockOnChange}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const listbox = screen.getByRole('listbox');
      const option = within(listbox).getByText('Visa ending in 1234');
      await user.click(option);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('calls onOptionChange with selected value', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          onOptionChange={mockOnChange}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const listbox = screen.getByRole('listbox');
      const option = within(listbox).getByText('Visa ending in 1234');
      await user.click(option);
      
      expect(mockOnChange).toHaveBeenCalledWith('card_visa123');
    });

    it('displays all options when opened', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByText('Visa ending in 1234')).toBeInTheDocument();
      expect(within(listbox).getByText('Mastercard ending in 5678')).toBeInTheDocument();
      expect(within(listbox).getByText('Add new payment method')).toBeInTheDocument();
    });

    it('updates selected option when clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          onOptionChange={mockOnChange}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const listbox = screen.getByRole('listbox');
      const option = within(listbox).getByText('Mastercard ending in 5678');
      await user.click(option);
      
      expect(mockOnChange).toHaveBeenCalledWith('card_mc456');
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.tab(); // Focus the combobox
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.tab(); // Focus the combobox
      await user.keyboard(' ');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('selects option when Enter is pressed on option', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          onOptionChange={mockOnChange}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const options = screen.getAllByRole('option');
      // Filter to get only visible options (not from hidden select)
      const visibleOptions = options.filter(opt => opt.parentElement?.getAttribute('role') === 'listbox');
      visibleOptions[0].focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnChange).toHaveBeenCalledWith('card_visa123');
    });
  });

  describe('Error Handling', () => {
    it('applies error styling when hasError is true', () => {
      const { container } = render(
        <PaymentMethodDropdown
          {...defaultProps}
          hasError={true}
        />
      );
      
      const combobox = container.querySelector('[role="combobox"]');
      expect(combobox).toHaveClass('border-border-error');
      expect(combobox).toHaveClass('ring-border-error');
    });

    it('calls onClearError when dropdown is opened', async () => {
      const user = userEvent.setup();
      const mockClearError = jest.fn();
      
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          hasError={true}
          onClearError={mockClearError}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      expect(mockClearError).toHaveBeenCalled();
    });

    it('shows error styling on chevron icon when hasError is true', () => {
      const { container } = render(
        <PaymentMethodDropdown
          {...defaultProps}
          hasError={true}
        />
      );
      
      const chevron = container.querySelector('svg');
      expect(chevron).toHaveClass('text-status-error');
    });
  });

  describe('Design System Integration', () => {
    it('uses surface-tertiary for default background', () => {
      const { container } = render(<PaymentMethodDropdown {...defaultProps} />);
      const combobox = container.querySelector('[role="combobox"]');
      expect(combobox).toHaveClass('bg-surface-tertiary');
    });

    it('uses bg-slate-200 for selected option in dropdown', async () => {
      const user = userEvent.setup();
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const options = screen.getAllByRole('option');
      // Filter to get only visible options (not from hidden select)
      const visibleOptions = options.filter(opt => opt.parentElement?.getAttribute('role') === 'listbox');
      const selectedOption = visibleOptions.find(opt => 
        opt.getAttribute('aria-selected') === 'true'
      );
      
      expect(selectedOption).toHaveClass('bg-slate-200');
    });

    it('displays selected value in combobox', () => {
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      
      const combobox = screen.getByRole('combobox');
      expect(within(combobox).getByText('Visa ending in 1234')).toBeInTheDocument();
    });

    it('uses text-secondary for placeholder text when unfocused', () => {
      const { container } = render(<PaymentMethodDropdown {...defaultProps} />);
      const combobox = container.querySelector('[role="combobox"]');
      // The text-secondary class is applied to the content div when no value is selected
      expect(combobox?.querySelector('.text-text-secondary')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('updates selected option when value prop changes', () => {
      const { rerender } = render(
        <PaymentMethodDropdown
          {...defaultProps}
          value={null}
        />
      );
      
      expect(screen.getByText('Select payment method')).toBeInTheDocument();
      
      rerender(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      
      const combobox = screen.getByRole('combobox');
      expect(within(combobox).getByText('Visa ending in 1234')).toBeInTheDocument();
    });

    it('shows aria-selected on correct option', async () => {
      const user = userEvent.setup();
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const options = screen.getAllByRole('option');
      // Filter to get only visible options (not from hidden select)
      const visibleOptions = options.filter(opt => opt.parentElement?.getAttribute('role') === 'listbox');
      expect(visibleOptions[0]).toHaveAttribute('aria-selected', 'true');
      expect(visibleOptions[1]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          options={[]}
        />
      );
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('handles options without brand property', async () => {
      const user = userEvent.setup();
      const optionsWithoutBrand = [
        { value: 'option1', display: 'Option 1' },
        { value: 'option2', display: 'Option 2' }
      ];
      
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          options={optionsWithoutBrand}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByText('Option 1')).toBeInTheDocument();
      expect(within(listbox).getByText('Option 2')).toBeInTheDocument();
    });

    it('handles long option text gracefully', () => {
      const longTextOptions = [
        {
          value: 'long',
          display: 'This is a very long payment method description that should be handled gracefully',
          brand: 'visa'
        }
      ];
      
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          options={longTextOptions}
          value="long"
        />
      );
      
      const combobox = screen.getByRole('combobox');
      expect(within(combobox).getByText(/This is a very long payment method/)).toBeInTheDocument();
    });
  });
});
