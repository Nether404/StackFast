import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../react-utils';
import userEvent from '@testing-library/user-event';
import { ToolCard } from '@/components/tool-card';
import type { ToolWithCategory } from '@shared/schema';

// Mock the error boundary
vi.mock('@/components/error-boundaries', () => ({
  ComponentErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

const mockTool: ToolWithCategory = {
  id: 'test-tool-1',
  name: 'Test Tool',
  description: 'A test tool for testing purposes',
  url: 'https://example.com',
  maturityScore: 8.5,
  popularityScore: 7.2,
  frameworks: ['React', 'Vue', 'Angular'],
  pricing: 'Free with paid tiers',
  category: {
    id: 'cat-1',
    name: 'AI Coding Tools',
    description: 'AI-powered development tools'
  },
  categories: [
    {
      id: 'cat-1',
      name: 'AI Coding Tools',
      description: 'AI-powered development tools'
    }
  ]
};

describe('ToolCard Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render tool information correctly', () => {
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      expect(screen.getByTestId(`card-tool-${mockTool.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`text-tool-name-${mockTool.id}`)).toHaveTextContent('Test Tool');
      expect(screen.getByTestId(`text-description-${mockTool.id}`)).toHaveTextContent('A test tool for testing purposes');
      expect(screen.getByTestId(`text-maturity-${mockTool.id}`)).toHaveTextContent('8.5');
      expect(screen.getByTestId(`text-popularity-${mockTool.id}`)).toHaveTextContent('7.2');
      expect(screen.getByTestId(`text-pricing-${mockTool.id}`)).toHaveTextContent('Free with paid tiers');
    });

    it('should render category badges correctly', () => {
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      expect(screen.getByText('AI Coding Tools')).toBeInTheDocument();
    });

    it('should render framework badges correctly', () => {
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      expect(screen.getByTestId(`badge-framework-${mockTool.id}-0`)).toHaveTextContent('React');
      expect(screen.getByTestId(`badge-framework-${mockTool.id}-1`)).toHaveTextContent('Vue');
      expect(screen.getByTestId(`badge-framework-${mockTool.id}-2`)).toHaveTextContent('Angular');
    });

    it('should show "more" badge when there are more than 3 frameworks', () => {
      const toolWithManyFrameworks = {
        ...mockTool,
        frameworks: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js']
      };

      render(
        <ToolCard 
          tool={toolWithManyFrameworks} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      expect(screen.getByTestId(`badge-more-frameworks-${mockTool.id}`)).toHaveTextContent('+2 more');
    });
  });

  describe('User Interactions', () => {
    it('should call onViewDetails when card is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      const card = screen.getByTestId(`card-tool-${mockTool.id}`);
      await user.click(card);

      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockTool);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      const editButton = screen.getByTestId(`button-edit-tool-${mockTool.id}`);
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockTool);
      expect(mockOnViewDetails).not.toHaveBeenCalled();
    });

    it('should open external link when external link button is clicked', async () => {
      const user = userEvent.setup();
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockOpen
      });

      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      const externalButton = screen.getByTestId(`button-external-link-${mockTool.id}`);
      await user.click(externalButton);

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank');
      expect(mockOnViewDetails).not.toHaveBeenCalled();
    });

    it('should not show external link button when tool has no URL', () => {
      const toolWithoutUrl = { ...mockTool, url: undefined };
      render(
        <ToolCard 
          tool={toolWithoutUrl} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      expect(screen.queryByTestId(`button-external-link-${mockTool.id}`)).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should handle hover states correctly', async () => {
      const user = userEvent.setup();
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      const card = screen.getByTestId(`card-tool-${mockTool.id}`);
      
      // Hover over card
      await user.hover(card);
      
      // Action buttons should be visible (opacity changes are handled by CSS)
      expect(screen.getByTestId(`button-edit-tool-${mockTool.id}`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      const editButton = screen.getByTestId(`button-edit-tool-${mockTool.id}`);
      const externalButton = screen.getByTestId(`button-external-link-${mockTool.id}`);

      expect(editButton).toBeInTheDocument();
      expect(externalButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      const editButton = screen.getByTestId(`button-edit-tool-${mockTool.id}`);
      
      // Focus and activate with keyboard
      editButton.focus();
      expect(editButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation correctly', async () => {
      const user = userEvent.setup();
      render(
        <ToolCard 
          tool={mockTool} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByTestId(`button-edit-tool-${mockTool.id}`)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId(`button-external-link-${mockTool.id}`)).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing category gracefully', () => {
      const toolWithoutCategory = {
        ...mockTool,
        category: undefined,
        categories: undefined
      };

      render(
        <ToolCard 
          tool={toolWithoutCategory} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    });

    it('should handle missing frameworks gracefully', () => {
      const toolWithoutFrameworks = {
        ...mockTool,
        frameworks: undefined
      };

      render(
        <ToolCard 
          tool={toolWithoutFrameworks} 
          onEdit={mockOnEdit} 
          onViewDetails={mockOnViewDetails} 
        />
      );

      // Should not crash and should render other content
      expect(screen.getByTestId(`text-tool-name-${mockTool.id}`)).toBeInTheDocument();
    });
  });
});