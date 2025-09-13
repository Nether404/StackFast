import type { Tool, Compatibility } from '@shared/schema';

export const mockTools: Tool[] = [
  {
    id: '1',
    name: 'React',
    description: 'A JavaScript library for building user interfaces',
    categoryId: 'frontend-framework',
    url: 'https://reactjs.org',
    frameworks: ['React'],
    languages: ['JavaScript', 'TypeScript'],
    features: ['Component-based', 'Virtual DOM'],
    integrations: ['Redux', 'Router'],
    maturityScore: 95,
    popularityScore: 95,
    setupComplexity: 'medium',
    costTier: 'free',
    performanceImpact: { buildTime: 'low', bundleSize: 'medium' },
    apiLastSync: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    name: 'TypeScript',
    description: 'TypeScript is JavaScript with syntax for types',
    categoryId: 'programming-language',
    url: 'https://www.typescriptlang.org',
    frameworks: null,
    languages: ['TypeScript'],
    features: ['Type Safety', 'Compile-time Checking'],
    integrations: ['Node.js', 'React'],
    maturityScore: 90,
    popularityScore: 90,
    setupComplexity: 'easy',
    costTier: 'free',
    performanceImpact: { buildTime: 'low', bundleSize: 'small' },
    apiLastSync: new Date('2024-01-10T15:30:00Z'),
  },
  {
    id: '3',
    name: 'Node.js',
    description: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine',
    categoryId: 'runtime',
    url: 'https://nodejs.org',
    frameworks: null,
    languages: ['JavaScript'],
    features: ['Server-side JavaScript', 'Event-driven'],
    integrations: ['Express', 'MongoDB'],
    maturityScore: 88,
    popularityScore: 88,
    setupComplexity: 'easy',
    costTier: 'free',
    performanceImpact: { buildTime: 'medium', bundleSize: 'large' },
    apiLastSync: new Date('2024-01-12T08:45:00Z'),
  },
];

export const mockCompatibilities: Compatibility[] = [
  {
    id: '1',
    toolOneId: '1',
    toolTwoId: '2',
    compatibilityScore: 95,
    notes: 'React and TypeScript work excellently together',
    verifiedIntegration: 1,
    integrationDifficulty: 'easy',
    setupSteps: [
      'Install TypeScript: npm install typescript',
      'Install React types: npm install @types/react @types/react-dom',
      'Configure tsconfig.json for React'
    ],
    codeExample: `import React from 'react';

interface Props {
  name: string;
}

const Component: React.FC<Props> = ({ name }) => {
  return <div>Hello, {name}!</div>;
};`,
    dependencies: ['@types/react', '@types/react-dom'],
  },
  {
    id: '2',
    toolOneId: '1',
    toolTwoId: '3',
    compatibilityScore: 85,
    notes: 'React can be used with Node.js for server-side rendering',
    verifiedIntegration: 1,
    integrationDifficulty: 'medium',
    setupSteps: [
      'Set up Next.js or custom SSR solution',
      'Configure build process',
      'Handle hydration properly'
    ],
    codeExample: `// Server-side rendering with React and Node.js
import React from 'react';
import { renderToString } from 'react-dom/server';
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  const html = renderToString(<App />);
  res.send(\`<!DOCTYPE html><html><body><div id="root">\${html}</div></body></html>\`);
});`,
    dependencies: ['react-dom'],
  },
  {
    id: '3',
    toolOneId: '2',
    toolTwoId: '3',
    compatibilityScore: 90,
    notes: 'TypeScript and Node.js are a perfect match for backend development',
    verifiedIntegration: 1,
    integrationDifficulty: 'easy',
    setupSteps: [
      'Install TypeScript: npm install typescript',
      'Install Node.js types: npm install @types/node',
      'Configure tsconfig.json for Node.js',
      'Set up build process with tsc or ts-node'
    ],
    codeExample: `import express, { Request, Response } from 'express';

const app = express();

app.get('/api/users', (req: Request, res: Response) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
    dependencies: ['@types/node'],
  },
];

export const mockApiResponses = {
  tools: {
    success: {
      success: true,
      data: mockTools,
      pagination: {
        page: 1,
        limit: 10,
        total: mockTools.length,
        totalPages: 1,
      },
    },
    error: {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: null,
        timestamp: new Date().toISOString(),
        requestId: 'test-request-id',
      },
    },
  },
  compatibilities: {
    success: {
      success: true,
      data: mockCompatibilities,
      pagination: {
        page: 1,
        limit: 10,
        total: mockCompatibilities.length,
        totalPages: 1,
      },
    },
    error: {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: { field: 'compatibilityScore', message: 'Must be between 0 and 100' },
        timestamp: new Date().toISOString(),
        requestId: 'test-request-id',
      },
    },
  },
};