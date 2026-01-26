import React from 'react';
import { render, screen } from '@testing-library/react';
import AddStorageFormMinimal from '../../src/components/features/orders/AddStorageForm.minimal';

describe('Minimal Test', () => {
  it('renders minimal component', () => {
    render(<AddStorageFormMinimal />);
    expect(screen.getByText('Add Storage Form')).toBeInTheDocument();
  });
});
