/**
 * @fileoverview Tests for PaymentMethodDropdown component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PaymentMethodDropdown } from '@/components/forms/PaymentMethodDropdown';

expect.extend(toHaveNoViolations);

// Mock useClickOutside hook
jest.mock('@/hooks', () => ({
  useClickOutside: jest.fn()
}));

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
      expect(screen.getByRole('button')).toBeInTheDocument();
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
      expect(screen.getByText('Visa ending in 1234')).toBeInTheDocument();
    });

    it('shows dropdown chevron icon', () => {
      const { container } = render(<PaymentMethodDropdown {...defaultProps} />);
      const chevron = container.querySelector('svg path[d*="M19 9l-7 7-7-7"]');
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
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label', 'Select card');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(screen.getByTestId('visa-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mastercard-icon')).toBeInTheDocument();
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(screen.getByTestId('visa-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mastercard-icon')).toBeInTheDocument();
      expect(screen.getByTestId('amex-icon')).toBeInTheDocument();
      expect(screen.getByTestId('discover-icon')).toBeInTheDocument();
      expect(screen.getByTestId('jcb-icon')).toBeInTheDocument();
      expect(screen.getByTestId('apple-icon')).toBeInTheDocument();
      expect(screen.getByTestId('amazon-icon')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      const option = screen.getByText('Visa ending in 1234');
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      const option = screen.getByText('Visa ending in 1234');
      await user.click(option);
      
      expect(mockOnChange).toHaveBeenCalledWith('card_visa123');
    });

    it('displays all options when opened', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(screen.getByText('Visa ending in 1234')).toBeInTheDocument();
      expect(screen.getByText('Mastercard ending in 5678')).toBeInTheDocument();
      expect(screen.getByText('Add new payment method')).toBeInTheDocument();
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      const option = screen.getByText('Mastercard ending in 5678');
      await user.click(option);
      
      expect(mockOnChange).toHaveBeenCalledWith('card_mc456');
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      const options = screen.getAllByRole('option');
      options[0].focus();
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
      
      const button = container.querySelector('[role="button"]');
      expect(button).toHaveClass('text-status-error');
      expect(button).toHaveClass('bg-status-bg-error');
      expect(button).toHaveClass('ring-status-error');
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
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
      const button = container.querySelector('[role="button"]');
      expect(button).toHaveClass('bg-surface-tertiary');
    });

    it('uses surface-secondary for selected option in dropdown', async () => {
      const user = userEvent.setup();
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      const options = screen.getAllByRole('option');
      const selectedOption = options.find(opt => 
        opt.getAttribute('aria-selected') === 'true'
      );
      
      expect(selectedOption).toHaveClass('bg-surface-secondary');
    });

    it('uses text-primary for selected text', () => {
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      
      const displayText = screen.getByText('Visa ending in 1234');
      expect(displayText).toHaveClass('text-text-primary');
    });

    it('uses text-secondary for placeholder text', () => {
      render(<PaymentMethodDropdown {...defaultProps} />);
      const placeholder = screen.getByText('Select payment method');
      expect(placeholder).toHaveClass('text-text-secondary');
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
      
      expect(screen.getByText('Visa ending in 1234')).toBeInTheDocument();
    });

    it('shows aria-selected on correct option', async () => {
      const user = userEvent.setup();
      render(
        <PaymentMethodDropdown
          {...defaultProps}
          value="card_visa123"
        />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
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
      
      expect(screen.getByRole('button')).toBeInTheDocument();
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
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
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
      
      expect(screen.getByText(/This is a very long payment method/)).toBeInTheDocument();
    });
  });
});

