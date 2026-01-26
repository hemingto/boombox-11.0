/**
 * @fileoverview Tests for bin-packing algorithm utilities
 */

import {
  packItems,
  calculateRecommendedUnits,
  toThreeJSPosition,
  toThreeJSDimensions,
  getContainerThreeJSDimensions,
  getContainerCenterPosition,
  CONTAINER,
  type SelectedItem,
} from '@/lib/utils';

describe('binPackingUtils', () => {
  describe('CONTAINER constants', () => {
    it('should have correct container dimensions', () => {
      expect(CONTAINER.LENGTH).toBe(95);
      expect(CONTAINER.WIDTH).toBe(56);
      expect(CONTAINER.HEIGHT).toBe(83.5);
      expect(CONTAINER.CUBIC_FEET).toBe(257);
    });
  });

  describe('calculateRecommendedUnits', () => {
    it('should return 0 for 0 cubic feet', () => {
      expect(calculateRecommendedUnits(0)).toBe(0);
    });

    it('should return 1 for volume less than container capacity', () => {
      expect(calculateRecommendedUnits(100)).toBe(1);
      expect(calculateRecommendedUnits(256)).toBe(1);
    });

    it('should return 1 for exactly container capacity', () => {
      expect(calculateRecommendedUnits(257)).toBe(1);
    });

    it('should return 2 for volume slightly over capacity', () => {
      expect(calculateRecommendedUnits(258)).toBe(2);
      expect(calculateRecommendedUnits(400)).toBe(2);
    });

    it('should correctly calculate for multiple containers', () => {
      expect(calculateRecommendedUnits(514)).toBe(2);
      expect(calculateRecommendedUnits(515)).toBe(3);
      expect(calculateRecommendedUnits(1000)).toBe(4);
    });
  });

  describe('packItems', () => {
    it('should return empty result for no items', () => {
      const result = packItems([]);

      expect(result.packedItems).toHaveLength(0);
      expect(result.containerCount).toBe(0);
      expect(result.totalVolumeCubicFeet).toBe(0);
      expect(result.lastContainerFillPercent).toBe(0);
    });

    it('should pack a single small item', () => {
      const items: SelectedItem[] = [
        {
          itemId: 'test-box',
          quantity: 1,
          width: 12,
          depth: 12,
          height: 12,
          color: '#ff0000',
        },
      ];

      const result = packItems(items);

      expect(result.packedItems).toHaveLength(1);
      expect(result.containerCount).toBe(1);
      expect(result.packedItems[0].containerIndex).toBe(0);
      expect(result.packedItems[0].position.x).toBe(0);
      expect(result.packedItems[0].position.y).toBe(0);
      expect(result.packedItems[0].position.z).toBe(0);
    });

    it('should expand items by quantity', () => {
      const items: SelectedItem[] = [
        {
          itemId: 'test-box',
          quantity: 3,
          width: 12,
          depth: 12,
          height: 12,
          color: '#ff0000',
        },
      ];

      const result = packItems(items);

      expect(result.packedItems).toHaveLength(3);
      expect(result.containerCount).toBe(1);
    });

    it('should sort items by height (NFD algorithm)', () => {
      const items: SelectedItem[] = [
        {
          itemId: 'short',
          quantity: 1,
          width: 10,
          depth: 10,
          height: 10,
          color: '#ff0000',
        },
        {
          itemId: 'tall',
          quantity: 1,
          width: 10,
          depth: 10,
          height: 50,
          color: '#00ff00',
        },
        {
          itemId: 'medium',
          quantity: 1,
          width: 10,
          depth: 10,
          height: 30,
          color: '#0000ff',
        },
      ];

      const result = packItems(items);

      // Tall items should be placed first (at y=0)
      const tallItem = result.packedItems.find(p => p.itemId === 'tall');
      expect(tallItem?.position.y).toBe(0);
    });

    it('should place items side by side in a row', () => {
      const items: SelectedItem[] = [
        {
          itemId: 'box1',
          quantity: 1,
          width: 20,
          depth: 20,
          height: 20,
          color: '#ff0000',
        },
        {
          itemId: 'box2',
          quantity: 1,
          width: 20,
          depth: 20,
          height: 20,
          color: '#00ff00',
        },
      ];

      const result = packItems(items);

      expect(result.packedItems).toHaveLength(2);
      // Second box should be offset in X
      expect(result.packedItems[1].position.x).toBeGreaterThan(0);
    });

    it('should create new container when items overflow', () => {
      // Create items that will definitely overflow one container
      const items: SelectedItem[] = [
        {
          itemId: 'large-item',
          quantity: 10,
          width: 40,
          depth: 40,
          height: 40,
          color: '#ff0000',
        },
      ];

      const result = packItems(items);

      expect(result.containerCount).toBeGreaterThan(1);
      // Some items should be in container 1
      const itemsInContainer1 = result.packedItems.filter(
        p => p.containerIndex === 1
      );
      expect(itemsInContainer1.length).toBeGreaterThan(0);
    });

    it('should calculate correct total volume', () => {
      const items: SelectedItem[] = [
        {
          itemId: 'box',
          quantity: 2,
          width: 12,
          depth: 12,
          height: 12,
          color: '#ff0000',
        },
      ];

      const result = packItems(items);

      // 12 * 12 * 12 = 1728 cubic inches = 1 cubic foot per box
      // 2 boxes = 2 cubic feet
      expect(result.totalVolumeCubicFeet).toBe(2);
    });
  });

  describe('toThreeJSPosition', () => {
    it('should convert position with default scale', () => {
      const position = { x: 0, y: 0, z: 0 };
      const dimensions = { width: 10, depth: 10, height: 10 };

      const result = toThreeJSPosition(position, dimensions, 0);

      // Position should be centered within container
      expect(result.x).toBeCloseTo((5 - CONTAINER.LENGTH / 2) * 0.01);
      expect(result.y).toBeCloseTo(5 * 0.01);
      expect(result.z).toBeCloseTo((5 - CONTAINER.WIDTH / 2) * 0.01);
    });

    it('should apply container offset for multiple containers', () => {
      const position = { x: 0, y: 0, z: 0 };
      const dimensions = { width: 10, depth: 10, height: 10 };

      const result0 = toThreeJSPosition(position, dimensions, 0);
      const result1 = toThreeJSPosition(position, dimensions, 1);

      // Second container should be offset in X
      expect(result1.x).toBeGreaterThan(result0.x);
    });
  });

  describe('toThreeJSDimensions', () => {
    it('should scale dimensions correctly', () => {
      const dimensions = { width: 100, depth: 50, height: 80 };

      const result = toThreeJSDimensions(dimensions);

      expect(result.width).toBe(1);
      expect(result.depth).toBe(0.5);
      expect(result.height).toBe(0.8);
    });

    it('should use custom scale', () => {
      const dimensions = { width: 100, depth: 50, height: 80 };

      const result = toThreeJSDimensions(dimensions, 0.1);

      expect(result.width).toBe(10);
      expect(result.depth).toBe(5);
      expect(result.height).toBe(8);
    });
  });

  describe('getContainerThreeJSDimensions', () => {
    it('should return scaled container dimensions', () => {
      const result = getContainerThreeJSDimensions();

      expect(result.width).toBeCloseTo(CONTAINER.LENGTH * 0.01);
      expect(result.height).toBeCloseTo(CONTAINER.HEIGHT * 0.01);
      expect(result.depth).toBeCloseTo(CONTAINER.WIDTH * 0.01);
    });
  });

  describe('getContainerCenterPosition', () => {
    it('should return center position for first container', () => {
      const result = getContainerCenterPosition(0);

      expect(result.x).toBe(0);
      expect(result.y).toBeCloseTo((CONTAINER.HEIGHT / 2) * 0.01);
      expect(result.z).toBe(0);
    });

    it('should offset subsequent containers', () => {
      const result0 = getContainerCenterPosition(0);
      const result1 = getContainerCenterPosition(1);

      expect(result1.x).toBeGreaterThan(result0.x);
      expect(result1.y).toBe(result0.y);
      expect(result1.z).toBe(result0.z);
    });
  });
});
