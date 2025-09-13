import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../react-utils';
import userEvent from '@testing-library/user-event';
import { QuickFilters } from '@/components/search/quick-filters';
import type { SearchFilters } from '@/lib/search-utils';

const defaultFilters: SearchFilters = {
  query: '',
  category: '',
  minPopularity: 0,
  minMaturity: 0,
  languages: [],
  frameworks: [],
  hasFreeTier: false,
  hasIntegrations: false,
  sortBy: 'popularity'
};

describe('QuickFilters Component', () => {
  const mockOnToggleFreeTier = vi.fn();
  const mockOnToggleIntegrations = vi.fn();
  const mockOnToggleAdvanced = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all filter buttons', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      expect(screen.getByText('Free Tier')).toBeInTheDocument();
      expect(screen.getByText('Has Integrations')).toBeInTheDocument();
      expect(screen.getByText('Show Advanced')).toBeInTheDocument();
    });

    it('should show correct icons for each button', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      // Check for icon presence by looking for SVG elements with specific classes
      const dollarIcon = document.querySelector('.lucide-dollar-sign');
      const branchIcon = document.querySelector('.lucide-git-branch');
      const filterIcon = document.querySelector('.lucide-filter');

      expect(dollarIcon).toBeInTheDocument();
      expect(branchIcon).toBeInTheDocument();
      expect(filterIcon).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should show active state for free tier when selected', () => {
      const filtersWithFreeTier: SearchFilters = {
        ...defaultFilters,
        hasFreeTier: true
      };

      render(
        <QuickFilters
          filters={filtersWithFreeTier}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const freeTierButton = screen.getByRole('button', { name: /free tier/i });
      expect(freeTierButton).toHaveClass('bg-neon-orange');
    });

    it('should show active state for integrations when selected', () => {
      const filtersWithIntegrations: SearchFilters = {
        ...defaultFilters,
        hasIntegrations: true
      };

      render(
        <QuickFilters
          filters={filtersWithIntegrations}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const integrationsButton = screen.getByRole('button', { name: /has integrations/i });
      expect(integrationsButton).toHaveClass('bg-neon-orange');
    });

    it('should show "Hide Advanced" when showAdvanced is true', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={true}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      expect(screen.getByText('Hide Advanced')).toBeInTheDocument();
      expect(screen.queryByText('Show Advanced')).not.toBeInTheDocument();
    });

    it('should show "Show Advanced" when showAdvanced is false', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      expect(screen.getByText('Show Advanced')).toBeInTheDocument();
      expect(screen.queryByText('Hide Advanced')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onToggleFreeTier when free tier button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const freeTierButton = screen.getByRole('button', { name: /free tier/i });
      await user.click(freeTierButton);

      expect(mockOnToggleFreeTier).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleIntegrations when integrations button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const integrationsButton = screen.getByRole('button', { name: /has integrations/i });
      await user.click(integrationsButton);

      expect(mockOnToggleIntegrations).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleAdvanced when advanced button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const advancedButton = screen.getByRole('button', { name: /show advanced/i });
      await user.click(advancedButton);

      expect(mockOnToggleAdvanced).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid clicks correctly', async () => {
      const user = userEvent.setup();
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const freeTierButton = screen.getByRole('button', { name: /free tier/i });
      
      await user.click(freeTierButton);
      await user.click(freeTierButton);
      await user.click(freeTierButton);

      expect(mockOnToggleFreeTier).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      // Tab through buttons
      await user.tab();
      const freeTierButton = screen.getByRole('button', { name: /free tier/i });
      expect(freeTierButton).toHaveFocus();

      await user.tab();
      const integrationsButton = screen.getByRole('button', { name: /has integrations/i });
      expect(integrationsButton).toHaveFocus();

      await user.tab();
      const advancedButton = screen.getByRole('button', { name: /show advanced/i });
      expect(advancedButton).toHaveFocus();
    });

    it('should handle keyboard activation', async () => {
      const user = userEvent.setup();
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const freeTierButton = screen.getByRole('button', { name: /free tier/i });
      freeTierButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnToggleFreeTier).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(mockOnToggleFreeTier).toHaveBeenCalledTimes(2);
    });

    it('should have descriptive button text', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      expect(screen.getByRole('button', { name: /free tier/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /has integrations/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show advanced/i })).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should apply correct CSS classes for active states', () => {
      const activeFilters: SearchFilters = {
        ...defaultFilters,
        hasFreeTier: true,
        hasIntegrations: true
      };

      render(
        <QuickFilters
          filters={activeFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const freeTierButton = screen.getByRole('button', { name: /free tier/i });
      const integrationsButton = screen.getByRole('button', { name: /has integrations/i });

      expect(freeTierButton).toHaveClass('bg-neon-orange', 'hover:bg-neon-orange/90');
      expect(integrationsButton).toHaveClass('bg-neon-orange', 'hover:bg-neon-orange/90');
    });

    it('should apply correct CSS classes for inactive states', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const freeTierButton = screen.getByRole('button', { name: /free tier/i });
      const integrationsButton = screen.getByRole('button', { name: /has integrations/i });

      expect(freeTierButton).not.toHaveClass('bg-neon-orange');
      expect(integrationsButton).not.toHaveClass('bg-neon-orange');
    });

    it('should maintain consistent button sizing', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('h-9'); // sm size class is actually h-9
      });
    });
  });

  describe('Props Handling', () => {
    it('should handle all filter combinations correctly', () => {
      const allActiveFilters: SearchFilters = {
        ...defaultFilters,
        hasFreeTier: true,
        hasIntegrations: true
      };

      render(
        <QuickFilters
          filters={allActiveFilters}
          showAdvanced={true}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      expect(screen.getByRole('button', { name: /free tier/i })).toHaveClass('bg-neon-orange');
      expect(screen.getByRole('button', { name: /has integrations/i })).toHaveClass('bg-neon-orange');
      expect(screen.getByText('Hide Advanced')).toBeInTheDocument();
    });

    it('should handle partial filter states', () => {
      const partialFilters: SearchFilters = {
        ...defaultFilters,
        hasFreeTier: true,
        hasIntegrations: false
      };

      render(
        <QuickFilters
          filters={partialFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      expect(screen.getByRole('button', { name: /free tier/i })).toHaveClass('bg-neon-orange');
      expect(screen.getByRole('button', { name: /has integrations/i })).not.toHaveClass('bg-neon-orange');
    });
  });

  describe('Layout and Responsiveness', () => {
    it('should use flexbox layout with proper gap', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('flex', 'flex-wrap', 'gap-2');
    });

    it('should handle button wrapping on smaller screens', () => {
      render(
        <QuickFilters
          filters={defaultFilters}
          showAdvanced={false}
          onToggleFreeTier={mockOnToggleFreeTier}
          onToggleIntegrations={mockOnToggleIntegrations}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('flex-wrap');
    });
  });
});