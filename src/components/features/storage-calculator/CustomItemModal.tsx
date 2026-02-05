/**
 * @fileoverview Custom item modal for storage calculator
 * Allows users to add items with custom dimensions
 */

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/primitives/Modal';
import { Input } from '@/components/ui/primitives/Input';
import { Button } from '@/components/ui/primitives/Button';

interface CustomItemModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when custom item is added */
  onAdd: (item: {
    name: string;
    dimensions: { length: number; width: number; height: number };
  }) => void;
}

/**
 * Modal for adding custom items with user-specified dimensions
 */
export function CustomItemModal({
  open,
  onClose,
  onAdd,
}: CustomItemModalProps) {
  const [name, setName] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setLength('');
    setWidth('');
    setHeight('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Item name is required';
    }

    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    if (!length || isNaN(lengthNum) || lengthNum <= 0) {
      newErrors.length = 'Valid length is required';
    }

    if (!width || isNaN(widthNum) || widthNum <= 0) {
      newErrors.width = 'Valid width is required';
    }

    if (!height || isNaN(heightNum) || heightNum <= 0) {
      newErrors.height = 'Valid height is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onAdd({
      name: name.trim(),
      dimensions: {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
      },
    });

    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Custom Item"
      size="sm"
      closeOnOverlayClick
    >
      <form onSubmit={handleSubmit} className="pt-0">
        <div className="space-y-4">
          <Input
            id="custom-item-name"
            label="Item Name"
            placeholder="e.g., Grandfather Clock"
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
            onClearError={() => setErrors(prev => ({ ...prev, name: '' }))}
            fullWidth
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              id="custom-item-length"
              label="Length (in)"
              placeholder="0"
              type="number"
              min="1"
              value={length}
              onChange={e => setLength(e.target.value)}
              error={errors.length}
              onClearError={() => setErrors(prev => ({ ...prev, length: '' }))}
              fullWidth
            />

            <Input
              id="custom-item-width"
              label="Width (in)"
              placeholder="0"
              type="number"
              min="1"
              value={width}
              onChange={e => setWidth(e.target.value)}
              error={errors.width}
              onClearError={() => setErrors(prev => ({ ...prev, width: '' }))}
              fullWidth
            />

            <Input
              id="custom-item-height"
              label="Height (in)"
              placeholder="0"
              type="number"
              min="1"
              value={height}
              onChange={e => setHeight(e.target.value)}
              error={errors.height}
              onClearError={() => setErrors(prev => ({ ...prev, height: '' }))}
              fullWidth
            />
          </div>
          <p className="text-sm mb-6 border-slate-100 border p-3 rounded-md">
            Enter the name and dimensions of your custom item in inches.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-12">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Item
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CustomItemModal;
