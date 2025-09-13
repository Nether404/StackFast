import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../react-utils';
import userEvent from '@testing-library/user-event';
import { MatrixCell } from '@/components/compatibility/matrix-cell';
import type { ToolWithCategory, CompatibilityMatrix } from '@shared/schema';

// Mock the tooltip components
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const mockTool1: ToolWithCategory = {
  id: 'tool-1',
  name: 'Tool One',
  description: 'First test tool',
  maturityScore: 8.0,
  popularityScore: 7.0,
  category: {
    id: 'cat-1',
    name: 'AI Coding Tools',
    description: 'AI tools'
  }
};

const mockTool2: ToolWithCategory = {
  id: 'tool-2',
  name: 'Tool Two',
  description: 'Second test tool',
  maturityScore: 6.5,
  popularityScore: 8.2,
  category: {
    id: 'cat-2',
    name: 'Frontend/Design',
    description: 'Frontend tools'
  }
};

const mockCompatibilityData: CompatibilityMatrix = {
  toolOneId: 'tool-1',
  toolTwoId: 'tool-2',
  compatibility: {
    id: 'comp-1',
    toolOneId: 'tool-1',
    toolTwoId: 'tool-2',
    compatibilityScore: 85.5,
    integrationDifficulty: 'medium',
    notes: 'Works well together with some configuration',
    verifiedIntegration: 1,
    codeExample: 'const integration = new Integration();',
    setupSteps: ['Step 1', 'Step 2'],
    dependencies: ['dep1', 'dep2']
  }
};

describe('MatrixCell Component', () => {
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Self-Compatibility (Diagonal)', () => {
    it('should render diagonal cell for same tool', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool1}
          compatibilityData={null}
          onEdit={mockOnEdit}
        />
      );

      const cell = screen.getByTestId(`cell-${mockTool1.id}-${mockTool1.id}`);
      expect(cell).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should not show edit button for diagonal cells', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool1}
          compatibilityData={null}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByTestId(`edit-${mockTool1.id}-${mockTool1.id}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`add-${mockTool1.id}-${mockTool1.id}`)).not.toBeInTheDocument();
    });
  });

  describe('Cell with Compatibility Data', () => {
    it('should render compatibility score', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      const cell = screen.getByTestId(`cell-${mockTool1.id}-${mockTool2.id}`);
      expect(cell).toBeInTheDocument();
      expect(screen.getByText('86')).toBeInTheDocument(); // Rounded score
    });

    it('should show edit button for existing compatibility', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTestId(`edit-${mockTool1.id}-${mockTool2.id}`);
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTestId(`edit-${mockTool1.id}-${mockTool2.id}`);
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockTool1, mockTool2, mockCompatibilityData);
    });

    it('should display tooltip content with compatibility details', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      // Tooltip content should be rendered (mocked)
      expect(screen.getByText(/Tool One ↔ Tool Two/)).toBeInTheDocument();
      expect(screen.getByText(/Compatibility: 85.5%/)).toBeInTheDocument();
      expect(screen.getByText(/Difficulty: medium/)).toBeInTheDocument();
      expect(screen.getByText('Works well together with some configuration')).toBeInTheDocument();
      expect(screen.getByText('Verified Integration')).toBeInTheDocument();
    });
  });

  describe('Cell without Compatibility Data', () => {
    it('should render unknown state when no compatibility data', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={null}
          onEdit={mockOnEdit}
        />
      );

      const cell = screen.getByTestId(`cell-${mockTool1.id}-${mockTool2.id}`);
      expect(cell).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should show add button when no compatibility data', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={null}
          onEdit={mockOnEdit}
        />
      );

      const addButton = screen.getByTestId(`add-${mockTool1.id}-${mockTool2.id}`);
      expect(addButton).toBeInTheDocument();
    });

    it('should call onEdit when add button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={null}
          onEdit={mockOnEdit}
        />
      );

      const addButton = screen.getByTestId(`add-${mockTool1.id}-${mockTool2.id}`);
      await user.click(addButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockTool1, mockTool2, null);
    });
  });

  describe('Compatibility Score Display', () => {
    it('should round compatibility scores correctly', () => {
      const testCases = [
        { score: 85.4, expected: '85' },
        { score: 85.6, expected: '86' },
        { score: 100.0, expected: '100' },
        { score: 0.4, expected: '0' },
        { score: 0.6, expected: '1' }
      ];

      testCases.forEach(({ score, expected }) => {
        const compatibilityWithScore = {
          ...mockCompatibilityData,
          compatibility: {
            ...mockCompatibilityData.compatibility!,
            compatibilityScore: score
          }
        };

        const { unmount } = render(
          <MatrixCell
            rowTool={mockTool1}
            colTool={mockTool2}
            compatibilityData={compatibilityWithScore}
            onEdit={mockOnEdit}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Integration Difficulty Handling', () => {
    it('should handle missing integration difficulty', () => {
      const compatibilityWithoutDifficulty = {
        ...mockCompatibilityData,
        compatibility: {
          ...mockCompatibilityData.compatibility!,
          integrationDifficulty: undefined
        }
      };

      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={compatibilityWithoutDifficulty}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/Difficulty: medium/)).toBeInTheDocument(); // Default fallback
    });

    it('should display different difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'] as const;
      
      difficulties.forEach(difficulty => {
        const compatibilityWithDifficulty = {
          ...mockCompatibilityData,
          compatibility: {
            ...mockCompatibilityData.compatibility!,
            integrationDifficulty: difficulty
          }
        };

        const { unmount } = render(
          <MatrixCell
            rowTool={mockTool1}
            colTool={mockTool2}
            compatibilityData={compatibilityWithDifficulty}
            onEdit={mockOnEdit}
          />
        );

        expect(screen.getByText(new RegExp(`Difficulty: ${difficulty}`))).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Verified Integration Badge', () => {
    it('should show verified badge when integration is verified', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Verified Integration')).toBeInTheDocument();
    });

    it('should not show verified badge when integration is not verified', () => {
      const unverifiedCompatibility = {
        ...mockCompatibilityData,
        compatibility: {
          ...mockCompatibilityData.compatibility!,
          verifiedIntegration: 0
        }
      };

      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={unverifiedCompatibility}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText('Verified Integration')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button attributes', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTestId(`edit-${mockTool1.id}-${mockTool2.id}`);
      expect(editButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTestId(`edit-${mockTool1.id}-${mockTool2.id}`);
      
      editButton.focus();
      expect(editButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation for add button', async () => {
      const user = userEvent.setup();
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={null}
          onEdit={mockOnEdit}
        />
      );

      const addButton = screen.getByTestId(`add-${mockTool1.id}-${mockTool2.id}`);
      
      addButton.focus();
      expect(addButton).toHaveFocus();
      
      await user.keyboard(' ');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct CSS classes based on compatibility score', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      const scoreElement = screen.getByText('86');
      const parentDiv = scoreElement.closest('div');
      
      // Should have matrix-cell class and compatibility-based classes
      expect(parentDiv).toHaveClass('matrix-cell');
    });

    it('should have consistent cell structure', () => {
      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={mockCompatibilityData}
          onEdit={mockOnEdit}
        />
      );

      const cell = screen.getByTestId(`cell-${mockTool1.id}-${mockTool2.id}`);
      expect(cell).toHaveClass('w-28', 'p-2', 'border-r', 'border-github-border');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing compatibility data gracefully', () => {
      const compatibilityWithoutData = {
        toolOneId: 'tool-1',
        toolTwoId: 'tool-2',
        compatibility: null
      };

      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={compatibilityWithoutData}
          onEdit={mockOnEdit}
        />
      );

      // Should render as if no compatibility data
      expect(screen.getByText('?')).toBeInTheDocument();
      expect(screen.getByTestId(`add-${mockTool1.id}-${mockTool2.id}`)).toBeInTheDocument();
    });

    it('should handle missing notes gracefully', () => {
      const compatibilityWithoutNotes = {
        ...mockCompatibilityData,
        compatibility: {
          ...mockCompatibilityData.compatibility!,
          notes: undefined
        }
      };

      render(
        <MatrixCell
          rowTool={mockTool1}
          colTool={mockTool2}
          compatibilityData={compatibilityWithoutNotes}
          onEdit={mockOnEdit}
        />
      );

      // Should still render other information
      expect(screen.getByText('86')).toBeInTheDocument();
      expect(screen.getByText(/Tool One ↔ Tool Two/)).toBeInTheDocument();
    });
  });
});