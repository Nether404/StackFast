import { vi } from 'vitest';

// Create a query client for testing
export const createTestQueryClient = () => {
  const { QueryClient } = require('@tanstack/react-query');
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Mock fetch responses
export const mockFetch = (response: any, ok = true, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  });
};

// Test data factories
export const createMockTool = (overrides = {}) => ({
  id: '1',
  name: 'Test Tool',
  description: 'A test tool for testing',
  categoryId: 'testing',
  url: 'https://test.com',
  frameworks: ['Test Framework'],
  languages: ['JavaScript'],
  features: ['Testing'],
  integrations: ['Jest'],
  maturityScore: 85,
  popularityScore: 85,
  setupComplexity: 'easy',
  costTier: 'free',
  performanceImpact: 'low',
  apiLastSync: new Date(),
  ...overrides,
});

export const createMockCompatibility = (overrides = {}) => ({
  id: '1',
  toolOneId: '1',
  toolTwoId: '2',
  compatibilityScore: 85,
  notes: 'Works well together',
  verifiedIntegration: 1,
  integrationDifficulty: 'easy' as const,
  setupSteps: ['Install both tools', 'Configure integration'],
  codeExample: 'const integration = new Integration();',
  dependencies: ['shared-lib'],
  ...overrides,
});