/**
 * @fileoverview Jest tests for Skeleton components
 */

import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
} from '@/components/ui/primitives/Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton (Base)', () => {
    it('renders with default classes', () => {
      render(<Skeleton data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('rounded', 'animate-pulse', 'bg-slate-200');
    });

    it('applies custom className', () => {
      render(<Skeleton className="custom-skeleton w-48 h-4" data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded', 'animate-pulse', 'bg-slate-200', 'custom-skeleton', 'w-48', 'h-4');
    });

    it('renders children when provided', () => {
      render(
        <Skeleton data-testid="skeleton">
          <div data-testid="skeleton-child">Custom content</div>
        </Skeleton>
      );
      
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-child')).toBeInTheDocument();
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  describe('SkeletonText', () => {
    it('renders with correct default classes', () => {
      render(<SkeletonText data-testid="skeleton-text" />);
      
      const skeletonText = screen.getByTestId('skeleton-text');
      expect(skeletonText).toHaveClass('skeleton-text', 'h-4');
    });

    it('applies custom className', () => {
      render(<SkeletonText className="w-32" data-testid="skeleton-text" />);
      
      const skeletonText = screen.getByTestId('skeleton-text');
      expect(skeletonText).toHaveClass('skeleton-text', 'h-4', 'w-32');
    });
  });

  describe('SkeletonTitle', () => {
    it('renders with correct default classes', () => {
      render(<SkeletonTitle data-testid="skeleton-title" />);
      
      const skeletonTitle = screen.getByTestId('skeleton-title');
      expect(skeletonTitle).toHaveClass('skeleton-title', 'h-6');
    });

    it('applies custom className', () => {
      render(<SkeletonTitle className="w-48" data-testid="skeleton-title" />);
      
      const skeletonTitle = screen.getByTestId('skeleton-title');
      expect(skeletonTitle).toHaveClass('skeleton-title', 'h-6', 'w-48');
    });
  });

  describe('SkeletonAvatar', () => {
    it('renders with correct default classes', () => {
      render(<SkeletonAvatar data-testid="skeleton-avatar" />);
      
      const skeletonAvatar = screen.getByTestId('skeleton-avatar');
      expect(skeletonAvatar).toHaveClass('skeleton-avatar', 'w-10', 'h-10', 'rounded-full');
    });

    it('applies custom className', () => {
      render(<SkeletonAvatar className="w-16 h-16" data-testid="skeleton-avatar" />);
      
      const skeletonAvatar = screen.getByTestId('skeleton-avatar');
      expect(skeletonAvatar).toHaveClass('skeleton-avatar', 'w-16', 'h-16', 'rounded-full');
    });
  });

  describe('SkeletonButton', () => {
    it('renders with correct default classes', () => {
      render(<SkeletonButton data-testid="skeleton-button" />);
      
      const skeletonButton = screen.getByTestId('skeleton-button');
      expect(skeletonButton).toHaveClass('h-10', 'w-24', 'rounded-md');
    });

    it('applies custom className', () => {
      render(<SkeletonButton className="w-32 h-12" data-testid="skeleton-button" />);
      
      const skeletonButton = screen.getByTestId('skeleton-button');
      expect(skeletonButton).toHaveClass('w-32', 'h-12', 'rounded-md');
    });
  });

  describe('SkeletonCard', () => {
    it('renders with default structure and lines', () => {
      render(<SkeletonCard data-testid="skeleton-card" />);
      
      const skeletonCard = screen.getByTestId('skeleton-card');
      expect(skeletonCard).toHaveClass('card', 'p-6');
      
      // Should have title (w-3/4) and 3 text lines by default
      const title = skeletonCard.querySelector('.skeleton-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('mb-4', 'w-3/4');
      
      // Should have 3 text lines by default
      const textLines = skeletonCard.querySelectorAll('.skeleton-text');
      expect(textLines).toHaveLength(3);
    });

    it('renders with custom number of lines', () => {
      render(<SkeletonCard lines={5} data-testid="skeleton-card" />);
      
      const skeletonCard = screen.getByTestId('skeleton-card');
      const textLines = skeletonCard.querySelectorAll('.skeleton-text');
      expect(textLines).toHaveLength(5);
    });

    it('applies different widths to last line', () => {
      render(<SkeletonCard lines={3} data-testid="skeleton-card" />);
      
      const skeletonCard = screen.getByTestId('skeleton-card');
      const textLines = skeletonCard.querySelectorAll('.skeleton-text');
      
      // First two lines should be full width
      expect(textLines[0]).toHaveClass('w-full');
      expect(textLines[1]).toHaveClass('w-full');
      
      // Last line should be half width
      expect(textLines[2]).toHaveClass('w-1/2');
    });

    it('applies custom className', () => {
      render(<SkeletonCard className="custom-card" data-testid="skeleton-card" />);
      
      const skeletonCard = screen.getByTestId('skeleton-card');
      expect(skeletonCard).toHaveClass('card', 'p-6', 'custom-card');
    });
  });

  describe('SkeletonTable', () => {
    it('renders with default rows and columns', () => {
      render(<SkeletonTable data-testid="skeleton-table" />);
      
      const skeletonTable = screen.getByTestId('skeleton-table');
      expect(skeletonTable).toHaveClass('space-y-4');
      
      // Should have header + 5 rows by default (6 total rows including header)
      const allRows = skeletonTable.querySelectorAll('.flex.space-x-4');
      expect(allRows).toHaveLength(6); // 1 header + 5 data rows
      
      // Each row should have 4 columns by default
      const firstRow = allRows[0];
      const columns = firstRow.querySelectorAll('.skeleton-text');
      expect(columns).toHaveLength(4);
    });

    it('renders with custom rows and columns', () => {
      render(<SkeletonTable rows={3} columns={5} data-testid="skeleton-table" />);
      
      const skeletonTable = screen.getByTestId('skeleton-table');
      
      // Should have header + 3 rows (4 total)
      const allRows = skeletonTable.querySelectorAll('.flex.space-x-4');
      expect(allRows).toHaveLength(4);
      
      // Each row should have 5 columns
      const firstRow = allRows[0];
      const columns = firstRow.querySelectorAll('.skeleton-text');
      expect(columns).toHaveLength(5);
    });

    it('applies custom className', () => {
      render(<SkeletonTable className="custom-table" data-testid="skeleton-table" />);
      
      const skeletonTable = screen.getByTestId('skeleton-table');
      expect(skeletonTable).toHaveClass('space-y-4', 'custom-table');
    });

    it('header has different styling than body rows', () => {
      render(<SkeletonTable rows={2} columns={3} data-testid="skeleton-table" />);
      
      const skeletonTable = screen.getByTestId('skeleton-table');
      const allRows = skeletonTable.querySelectorAll('.flex.space-x-4');
      
      // Header row elements should have h-5 class
      const headerCells = allRows[0].querySelectorAll('.skeleton-text');
      headerCells.forEach(cell => {
        expect(cell).toHaveClass('h-5');
      });
      
      // Body row elements should have default h-4 class
      const bodyCells = allRows[1].querySelectorAll('.skeleton-text');
      bodyCells.forEach(cell => {
        expect(cell).toHaveClass('h-4');
      });
    });
  });

  describe('SkeletonList', () => {
    it('renders with default number of items', () => {
      render(<SkeletonList data-testid="skeleton-list" />);
      
      const skeletonList = screen.getByTestId('skeleton-list');
      expect(skeletonList).toHaveClass('space-y-4');
      
      // Should have 3 items by default
      const listItems = skeletonList.querySelectorAll('.flex.items-center.space-x-4');
      expect(listItems).toHaveLength(3);
    });

    it('renders with custom number of items', () => {
      render(<SkeletonList items={5} data-testid="skeleton-list" />);
      
      const skeletonList = screen.getByTestId('skeleton-list');
      const listItems = skeletonList.querySelectorAll('.flex.items-center.space-x-4');
      expect(listItems).toHaveLength(5);
    });

    it('each item has avatar and text content', () => {
      render(<SkeletonList items={2} data-testid="skeleton-list" />);
      
      const skeletonList = screen.getByTestId('skeleton-list');
      const listItems = skeletonList.querySelectorAll('.flex.items-center.space-x-4');
      
      listItems.forEach(item => {
        // Should have avatar
        const avatar = item.querySelector('.skeleton-avatar');
        expect(avatar).toBeInTheDocument();
        
        // Should have text content area with 2 text lines
        const textArea = item.querySelector('.flex-1.space-y-2');
        expect(textArea).toBeInTheDocument();
        
        const textLines = textArea!.querySelectorAll('.skeleton-text');
        expect(textLines).toHaveLength(2);
        
        // First line should be 3/4 width, second should be 1/2 width
        expect(textLines[0]).toHaveClass('w-3/4');
        expect(textLines[1]).toHaveClass('w-1/2');
      });
    });

    it('applies custom className', () => {
      render(<SkeletonList className="custom-list" data-testid="skeleton-list" />);
      
      const skeletonList = screen.getByTestId('skeleton-list');
      expect(skeletonList).toHaveClass('space-y-4', 'custom-list');
    });
  });

  describe('Component Integration', () => {
    it('all skeleton components render without errors', () => {
      render(
        <div>
          <Skeleton className="w-full h-4" />
          <SkeletonText />
          <SkeletonTitle />
          <SkeletonAvatar />
          <SkeletonButton />
          <SkeletonCard />
          <SkeletonTable rows={2} columns={2} />
          <SkeletonList items={2} />
        </div>
      );
      
      // Verify all components render by checking for pulse animation classes
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(document.querySelector('.bg-slate-200')).toBeInTheDocument();
    });

    it('nested skeleton components work correctly', () => {
      render(
        <Skeleton className="p-4" data-testid="parent-skeleton">
          <SkeletonText />
          <SkeletonAvatar />
        </Skeleton>
      );
      
      const parentSkeleton = screen.getByTestId('parent-skeleton');
      expect(parentSkeleton).toBeInTheDocument();
      expect(parentSkeleton.querySelector('.skeleton-text')).toBeInTheDocument();
      expect(parentSkeleton.querySelector('.skeleton-avatar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('skeleton components have appropriate ARIA attributes', () => {
      render(
        <div>
          <Skeleton aria-label="Loading content" data-testid="skeleton" />
          <SkeletonCard aria-label="Loading card" data-testid="skeleton-card" />
        </div>
      );
      
      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-label', 'Loading content');
      expect(screen.getByTestId('skeleton-card')).toHaveAttribute('aria-label', 'Loading card');
    });

    it('skeleton components accept role attributes', () => {
      render(<Skeleton role="status" data-testid="skeleton" />);
      
      expect(screen.getByTestId('skeleton')).toHaveAttribute('role', 'status');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('base skeleton has required CSS classes for animation', () => {
      render(<Skeleton data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse', 'bg-slate-200');
    });

    it('all skeleton variants include base skeleton class', () => {
      render(
        <div>
          <SkeletonText data-testid="text" />
          <SkeletonTitle data-testid="title" />
          <SkeletonAvatar data-testid="avatar" />
          <SkeletonButton data-testid="button" />
        </div>
      );
      
      // SkeletonText and SkeletonTitle should have skeleton class via className merging
      expect(screen.getByTestId('text')).toHaveClass('skeleton-text');
      expect(screen.getByTestId('title')).toHaveClass('skeleton-title');
      expect(screen.getByTestId('avatar')).toHaveClass('skeleton-avatar');
    });

    it('preserves additional CSS classes when merged', () => {
      render(
        <SkeletonText className="custom-class another-class" data-testid="skeleton-text" />
      );
      
      const skeletonText = screen.getByTestId('skeleton-text');
      expect(skeletonText).toHaveClass('skeleton-text', 'custom-class', 'another-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero items in SkeletonList', () => {
      render(<SkeletonList items={0} data-testid="skeleton-list" />);
      
      const skeletonList = screen.getByTestId('skeleton-list');
      expect(skeletonList).toBeInTheDocument();
      expect(skeletonList.children).toHaveLength(0);
    });

    it('handles zero rows in SkeletonTable', () => {
      render(<SkeletonTable rows={0} columns={3} data-testid="skeleton-table" />);
      
      const skeletonTable = screen.getByTestId('skeleton-table');
      expect(skeletonTable).toBeInTheDocument();
      // Should still have header row
      const rows = skeletonTable.querySelectorAll('.flex.space-x-4');
      expect(rows).toHaveLength(1); // Only header
    });

    it('handles zero columns in SkeletonTable', () => {
      render(<SkeletonTable rows={2} columns={0} data-testid="skeleton-table" />);
      
      const skeletonTable = screen.getByTestId('skeleton-table');
      expect(skeletonTable).toBeInTheDocument();
      const rows = skeletonTable.querySelectorAll('.flex.space-x-4');
      expect(rows).toHaveLength(3); // Header + 2 rows
      
      // Each row should have no columns
      rows.forEach(row => {
        const columns = row.querySelectorAll('.skeleton-text');
        expect(columns).toHaveLength(0);
      });
    });

    it('handles zero lines in SkeletonCard', () => {
      render(<SkeletonCard lines={0} data-testid="skeleton-card" />);
      
      const skeletonCard = screen.getByTestId('skeleton-card');
      expect(skeletonCard).toBeInTheDocument();
      
      // Should still have title
      const title = skeletonCard.querySelector('.skeleton-title');
      expect(title).toBeInTheDocument();
      
      // Should have no text lines
      const textLines = skeletonCard.querySelectorAll('.skeleton-text');
      expect(textLines).toHaveLength(0);
    });
  });
});
