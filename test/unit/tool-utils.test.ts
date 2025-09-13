/**
 * Unit tests for tool utility functions
 * Tests compatibility engine and scoring algorithms
 */

import { describe, it, expect } from 'vitest';
import {
  getCategoryIcon,
  getCategoryColor,
  getCompatibilityClass,
  getCompatibilityScore,
  filterTools,
  truncateText
} from '../../client/src/lib/tool-utils';
import type { ToolWithCategory, CompatibilityMatrix } from '@shared/schema';

describe('Tool Utils - Compatibility Engine', () => {
  // Mock data for testing
  const mockTool1: ToolWithCategory = {
    id: '1',
    name: 'React',
    description: 'A JavaScript library for building user interfaces',
    categoryId: 'frontend',
    url: 'https://reactjs.org',
    frameworks: ['React'],
    languages: ['JavaScript', 'TypeScript'],
    features: ['Component-based', 'Virtual DOM'],
    integrations: ['Redux', 'Router'],
    maturityScore: 95,
    popularityScore: 95,
    setupComplexity: 'medium',
    costTier: 'free',
    performanceImpact: null,
    pricing: null,
    notes: null,
    apiLastSync: new Date(),
    category: {
      id: 'frontend',
      name: 'Frontend/Design',
      description: 'Frontend frameworks and design tools',
      color: '#FF4500'
    }
  };

  const mockTool2: ToolWithCategory = {
    id: '2',
    name: 'TypeScript',
    description: 'TypeScript is JavaScript with syntax for types',
    categoryId: 'language',
    url: 'https://www.typescriptlang.org',
    frameworks: null,
    languages: ['TypeScript'],
    features: ['Type Safety', 'Compile-time Checking'],
    integrations: ['Node.js', 'React'],
    maturityScore: 90,
    popularityScore: 88,
    setupComplexity: 'easy',
    costTier: 'free',
    performanceImpact: null,
    pricing: null,
    notes: null,
    apiLastSync: new Date(),
    category: {
      id: 'language',
      name: 'Programming Language',
      description: 'Programming languages and compilers',
      color: '#00FF00'
    }
  };

  const mockCompatibilityMatrix: CompatibilityMatrix[] = [
    {
      toolOne: mockTool1,
      toolTwo: mockTool2,
      compatibility: {
        id: '1',
        toolOneId: '1',
        toolTwoId: '2',
        compatibilityScore: 95,
        notes: 'Excellent compatibility',
        verifiedIntegration: 1,
        integrationDifficulty: 'easy',
        setupSteps: ['Install TypeScript', 'Configure tsconfig.json'],
        codeExample: 'const component: React.FC = () => <div>Hello</div>;',
        dependencies: ['@types/react']
      }
    }
  ];

  describe('getCategoryIcon', () => {
    it('should return correct icon for AI coding tools', () => {
      expect(getCategoryIcon('AI Coding Tools')).toBe('🤖');
      expect(getCategoryIcon('ai coding tools')).toBe('🤖');
    });

    it('should return correct icon for frontend/design', () => {
      expect(getCategoryIcon('Frontend/Design')).toBe('🎨');
      expect(getCategoryIcon('frontend/design')).toBe('🎨');
    });

    it('should return correct icon for backend/database', () => {
      expect(getCategoryIcon('Backend/Database')).toBe('🗄️');
      expect(getCategoryIcon('backend/database')).toBe('🗄️');
    });

    it('should return correct icon for payment platforms', () => {
      expect(getCategoryIcon('Payment Platforms')).toBe('💳');
      expect(getCategoryIcon('payment platforms')).toBe('💳');
    });

    it('should return default icon for unknown categories', () => {
      expect(getCategoryIcon('Unknown Category')).toBe('🔧');
      expect(getCategoryIcon('')).toBe('🔧');
    });
  });

  describe('getCategoryColor', () => {
    it('should return correct color class for AI coding tools', () => {
      expect(getCategoryColor('AI Coding Tools')).toBe('text-neon-orange');
      expect(getCategoryColor('ai coding tools')).toBe('text-neon-orange');
    });

    it('should return correct color class for frontend/design', () => {
      expect(getCategoryColor('Frontend/Design')).toBe('text-info');
      expect(getCategoryColor('frontend/design')).toBe('text-info');
    });

    it('should return correct color class for backend/database', () => {
      expect(getCategoryColor('Backend/Database')).toBe('text-success');
      expect(getCategoryColor('backend/database')).toBe('text-success');
    });

    it('should return correct color class for payment platforms', () => {
      expect(getCategoryColor('Payment Platforms')).toBe('text-warning');
      expect(getCategoryColor('payment platforms')).toBe('text-warning');
    });

    it('should return default color class for unknown categories', () => {
      expect(getCategoryColor('Unknown Category')).toBe('text-github-text-secondary');
      expect(getCategoryColor('')).toBe('text-github-text-secondary');
    });
  });

  describe('getCompatibilityClass', () => {
    it('should return high compatibility class for scores >= 90', () => {
      expect(getCompatibilityClass(90)).toBe('compatibility-high');
      expect(getCompatibilityClass(95)).toBe('compatibility-high');
      expect(getCompatibilityClass(100)).toBe('compatibility-high');
    });

    it('should return medium compatibility class for scores 70-89', () => {
      expect(getCompatibilityClass(70)).toBe('compatibility-medium');
      expect(getCompatibilityClass(80)).toBe('compatibility-medium');
      expect(getCompatibilityClass(89)).toBe('compatibility-medium');
    });

    it('should return low compatibility class for scores 50-69', () => {
      expect(getCompatibilityClass(50)).toBe('compatibility-low');
      expect(getCompatibilityClass(60)).toBe('compatibility-low');
      expect(getCompatibilityClass(69)).toBe('compatibility-low');
    });

    it('should return none compatibility class for scores < 50', () => {
      expect(getCompatibilityClass(0)).toBe('compatibility-none');
      expect(getCompatibilityClass(25)).toBe('compatibility-none');
      expect(getCompatibilityClass(49)).toBe('compatibility-none');
    });
  });

  describe('getCompatibilityScore', () => {
    it('should find compatibility between two tools', () => {
      const result = getCompatibilityScore(mockTool1, mockTool2, mockCompatibilityMatrix);
      expect(result).toBeDefined();
      expect(result?.compatibility.compatibilityScore).toBe(95);
    });

    it('should find compatibility in reverse order', () => {
      const result = getCompatibilityScore(mockTool2, mockTool1, mockCompatibilityMatrix);
      expect(result).toBeDefined();
      expect(result?.compatibility.compatibilityScore).toBe(95);
    });

    it('should return null for self-compatibility', () => {
      const result = getCompatibilityScore(mockTool1, mockTool1, mockCompatibilityMatrix);
      expect(result).toBeNull();
    });

    it('should return null when no compatibility exists', () => {
      const mockTool3: ToolWithCategory = { ...mockTool1, id: '3', name: 'Vue' };
      const result = getCompatibilityScore(mockTool1, mockTool3, mockCompatibilityMatrix);
      expect(result).toBeNull();
    });
  });

  describe('filterTools', () => {
    const mockTools: ToolWithCategory[] = [
      mockTool1,
      mockTool2,
      {
        ...mockTool1,
        id: '3',
        name: 'Vue.js',
        description: 'The Progressive JavaScript Framework',
        maturityScore: 85,
        category: { ...mockTool1.category, name: 'Frontend/Design' }
      }
    ];

    it('should filter tools by search query in name', () => {
      const result = filterTools(mockTools, 'React', { category: 'all', compatibility: 'all', maturity: 'all' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('React');
    });

    it('should filter tools by search query in description', () => {
      const result = filterTools(mockTools, 'JavaScript', { category: 'all', compatibility: 'all', maturity: 'all' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(tool => tool.description?.includes('JavaScript'))).toBe(true);
    });

    it('should filter tools by category', () => {
      const result = filterTools(mockTools, '', { category: 'frontend-design', compatibility: 'all', maturity: 'all' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(tool => tool.category.name.toLowerCase().includes('frontend'))).toBe(true);
    });

    it('should filter tools by maturity level - mature', () => {
      const result = filterTools(mockTools, '', { category: 'all', compatibility: 'all', maturity: 'mature' });
      const matureTools = result.filter(tool => (tool.maturityScore || 0) >= 8.0);
      expect(matureTools.length).toBeGreaterThan(0);
    });

    it('should filter tools by maturity level - stable', () => {
      const result = filterTools(mockTools, '', { category: 'all', compatibility: 'all', maturity: 'stable' });
      const stableTools = result.filter(tool => {
        const score = tool.maturityScore || 0;
        return score >= 6.0 && score < 8.0;
      });
      expect(stableTools.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter tools by maturity level - beta', () => {
      const result = filterTools(mockTools, '', { category: 'all', compatibility: 'all', maturity: 'beta' });
      const betaTools = result.filter(tool => (tool.maturityScore || 0) < 6.0);
      expect(betaTools.length).toBeGreaterThanOrEqual(0);
    });

    it('should return all tools when no filters applied', () => {
      const result = filterTools(mockTools, '', { category: 'all', compatibility: 'all', maturity: 'all' });
      expect(result).toHaveLength(mockTools.length);
    });

    it('should handle empty search query', () => {
      const result = filterTools(mockTools, '', { category: 'all', compatibility: 'all', maturity: 'all' });
      expect(result).toHaveLength(mockTools.length);
    });

    it('should handle null/undefined values safely', () => {
      const toolWithNulls: ToolWithCategory = {
        ...mockTool1,
        id: '4',
        name: 'Test Tool',
        description: null,
        category: { ...mockTool1.category, name: null as any }
      };
      const toolsWithNulls = [...mockTools, toolWithNulls];
      
      expect(() => {
        filterTools(toolsWithNulls, 'test', { category: 'all', compatibility: 'all', maturity: 'all' });
      }).not.toThrow();
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than max length', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + 3 for "..."
    });

    it('should not truncate text shorter than max length', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    it('should handle exact length match', () => {
      const text = 'Exactly twenty chars';
      const result = truncateText(text, 20);
      expect(result).toBe('Exactly twenty chars');
    });

    it('should handle empty string', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    it('should handle zero max length', () => {
      const result = truncateText('test', 0);
      expect(result).toBe('...');
    });
  });
});