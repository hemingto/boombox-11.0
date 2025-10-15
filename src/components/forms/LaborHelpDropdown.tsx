/**
 * @fileoverview Labor Help Dropdown - Specialized dropdown for selecting unloading assistance
 * @source boombox-10.0/src/app/components/reusablecomponents/laborhelpdropdown.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a specialized dropdown for users to select whether they need help unloading storage units.
 * Features two predefined options: "Full Service Plan" (paid assistance) and "Do It Yourself Plan" (free).
 * 
 * API ROUTES UPDATED:
 * None - This is a pure UI component with no API dependencies
 * 
 * DESIGN SYSTEM UPDATES:
 * - Updated colors to use design system tokens (primary, surface, text, border)
 * - Applied standardized hover/focus states using design system patterns
 * - Consistent error styling with form error patterns from globals.css
 * - Shadow styles updated to use design system custom-shadow
 * 
 * @refactor Migrated from boombox-10.0 with design system compliance and improved accessibility
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';
import { LABOR_HELP_OPTIONS, type LaborOption } from '@/data/laborOptions';
import { useClickOutside } from '@/hooks/useClickOutside';

interface LaborHelpDropdownProps {
  value: string;
  onLaborChange: (id: string, plan: string, description: string) => void;
  hasError?: boolean;
  onClearError?: () => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}

const LaborHelpDropdown: React.FC<LaborHelpDropdownProps> = ({
  value,
  onLaborChange,
  hasError,
  onClearError,
  name,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = LABOR_HELP_OPTIONS.find(option => option.id === value);

  const handleOptionClick = (option: LaborOption) => {
    if (disabled) return;
    
    onLaborChange(option.id, option.plan, option.description || '');
    setIsOpen(false);
    if (onClearError) {
      onClearError();
    }
  };

  const handleDropdownToggle = () => {
    if (disabled) return;
    
    setIsOpen(!isOpen);
    if (onClearError && hasError) {
      onClearError();
    }
  };

  // Close dropdown if clicked outside
  useClickOutside(ref, () => setIsOpen(false));

  // Keyboard navigation support
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleDropdownToggle();
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  const dropdownClasses = cn(
    // Base dropdown trigger styling matching design system input-field pattern
    'relative rounded-md py-2.5 px-3 cursor-pointer flex justify-between items-center transition-colors duration-200',
    {
      // Error state styling matching input-field--error pattern
      'text-status-error bg-red-50 ring-2 ring-border-error border-border-error': hasError && !disabled,
      
      // Open/focused state styling matching input-field focus pattern
      'ring-2 ring-border-focus bg-surface-primary border-transparent': isOpen && !hasError && !disabled,
      
      // Default state styling matching input-field default pattern
      'ring-2 ring-border bg-surface-tertiary border-border': !isOpen && !hasError && !disabled,
      
      // Disabled state styling matching input-field disabled pattern
      'bg-surface-disabled cursor-not-allowed ring-2 ring-border text-text-secondary': disabled,
    },
    className
  );

  const chevronClasses = cn(
    'w-5 h-5 transition-colors ml-2 flex-shrink-0',
    {
      'text-status-error': hasError && !disabled,
      'text-text-secondary': disabled || (!hasError && !disabled && !selectedOption),
      'text-text-primary': selectedOption && !hasError && !disabled,
    }
  );

  const selectedContentClasses = cn(
    'text-sm flex-1',
    {
      'text-status-error': hasError && !disabled,
      'text-text-secondary': disabled || (!selectedOption && !hasError),
      'text-text-primary': selectedOption && !hasError && !disabled,
    }
  );

  return (
    <div className="w-full relative" ref={ref}>
      {/* Hidden select for form submission and accessibility */}
      <select
        value={value}
        onChange={() => {}} // Controlled by custom dropdown
        name={name}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        className="sr-only"
        tabIndex={-1}
      >
        <option value="">Select if you need unloading help</option>
        {LABOR_HELP_OPTIONS.map(option => (
          <option key={option.id} value={option.id}>
            {option.title}
          </option>
        ))}
      </select>

      {/* Dropdown Header */}
      <div
        className={dropdownClasses}
        onClick={handleDropdownToggle}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={hasError ? 'true' : 'false'}
        aria-label="Select labor help option"
        tabIndex={disabled ? -1 : 0}
      >
        <div className="flex items-center space-x-3 flex-1">
          {selectedOption && (
            <selectedOption.icon 
              className="w-6 h-6 text-text-primary flex-shrink-0" 
              aria-hidden="true"
            />
          )}
          <span className={selectedContentClasses}>
            {selectedOption ? selectedOption.title : 'Select if you need unloading help'}
          </span>
        </div>
        <ChevronDownIcon
          className={chevronClasses}
          aria-hidden="true"
        />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 border border-gray-200 rounded-md bg-surface-primary shadow-custom-shadow max-h-60 overflow-auto"
          role="listbox"
          aria-label="Labor help options"
        >
          {LABOR_HELP_OPTIONS.map(option => (
            <div
              key={option.id}
              className={cn(
                'flex justify-between items-center p-4 cursor-pointer transition-colors duration-200',
                {
                  'hover:bg-surface-tertiary': !disabled,
                  'bg-surface-disabled': value === option.id,
                  'bg-surface-primary': value !== option.id,
                }
              )}
              onClick={() => handleOptionClick(option)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick(option);
                }
              }}
              role="option"
              aria-selected={value === option.id}
              tabIndex={disabled ? -1 : 0}
            >
              <div className="flex items-center">
                <option.icon 
                  className="w-6 h-6 text-text-primary mr-3 flex-shrink-0" 
                  aria-hidden="true"
                />
                <div>
                  <div className="text-sm text-text-primary font-medium">{option.title}</div>
                  {option.plan && (
                    <div className="text-text-secondary text-xs mt-1">{option.plan}</div>
                  )}
                </div>
              </div>
              {option.description && (
                <span className="font-medium text-sm text-text-primary text-nowrap ml-4">
                  {option.description}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LaborHelpDropdown;
