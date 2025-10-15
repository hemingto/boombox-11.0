/**
 * @fileoverview Tests for DriverTips component
 * Following boombox-11.0 testing standards
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { DriverTips } from '@/components/features/service-providers/best-practices/DriverTips';

expect.extend(toHaveNoViolations);

describe('DriverTips', () => {
  describe('Rendering', () => {
    it('renders without crashing with driver tips', () => {
      render(<DriverTips userType="driver" />);
      expect(screen.getByText('Driver Tips')).toBeInTheDocument();
    });

    it('renders without crashing with mover tips', () => {
      render(<DriverTips userType="mover" />);
      expect(screen.getByText('Mover Tips')).toBeInTheDocument();
    });

    it('displays correct number of tips for drivers', () => {
      render(<DriverTips userType="driver" />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(6);
    });

    it('displays correct number of tips for movers', () => {
      render(<DriverTips userType="mover" />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(6);
    });

    it('displays driver-specific tips when userType is driver', () => {
      render(<DriverTips userType="driver" />);
      expect(
        screen.getByText(
          /Head directly to customer's location, and return directly to warehouse/i
        )
      ).toBeInTheDocument();
    });

    it('displays mover-specific tips when userType is mover', () => {
      render(<DriverTips userType="mover" />);
      expect(
        screen.getByText(
          /Wrap all furniture items in moving blankets and plastic wrap/i
        )
      ).toBeInTheDocument();
    });

    it('renders checkmark icons for each tip', () => {
      const { container } = render(<DriverTips userType="driver" />);
      const checkIcons = container.querySelectorAll('svg');
      // 6 tips = 6 check icons
      expect(checkIcons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with driver tips', async () => {
      const renderResult = render(<DriverTips userType="driver" />);
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with mover tips', async () => {
      const renderResult = render(<DriverTips userType="mover" />);
      await testAccessibility(renderResult);
    });

    it('uses semantic list structure', () => {
      render(<DriverTips userType="driver" />);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('UL');
    });

    it('has proper heading element', () => {
      render(<DriverTips userType="driver" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Driver Tips');
    });

    it('marks decorative icons with aria-hidden', () => {
      const { container } = render(<DriverTips userType="driver" />);
      const decorativeIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Design System', () => {
    it('applies design system color tokens', () => {
      const { container } = render(<DriverTips userType="driver" />);
      const tipsList = container.querySelector('ul');
      expect(tipsList).toHaveClass('border-border');
    });

    it('uses primary color for checkmark backgrounds', () => {
      const { container } = render(<DriverTips userType="driver" />);
      const checkmarkContainer = container.querySelector(
        '.bg-primary'
      );
      expect(checkmarkContainer).toBeInTheDocument();
    });

    it('applies consistent spacing', () => {
      const { container } = render(<DriverTips userType="driver" />);
      const tipsList = container.querySelector('ul');
      expect(tipsList).toHaveClass('space-y-6');
      expect(tipsList).toHaveClass('p-6');
    });
  });

  describe('Content Validation', () => {
    it('displays all required driver tips', () => {
      render(<DriverTips userType="driver" />);
      
      const expectedTips = [
        "Head directly to customer's location",
        'Make sure you and your vehicle are clean and professional',
        'Park in a safe location',
        'Greet the customer in a professional manner',
        'Once the unit is finished being loaded take a photo',
        "make sure the door is securely shut and the customer's padlock",
      ];

      expectedTips.forEach((tip) => {
        expect(screen.getByText(new RegExp(tip, 'i'))).toBeInTheDocument();
      });
    });

    it('displays all required mover tips', () => {
      render(<DriverTips userType="mover" />);
      
      const expectedTips = [
        'Wrap all furniture items in moving blankets',
        'load heavier items on the base',
        'items are secure and will not shift',
        'Never slide furniture across a floor',
        'Think before lifting',
        'Use tools',
      ];

      expectedTips.forEach((tip) => {
        expect(screen.getByText(new RegExp(tip, 'i'))).toBeInTheDocument();
      });
    });
  });
});

