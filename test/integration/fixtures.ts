import type { Tool, Compatibility, ToolCategory } from '@shared/schema';

export const testCategories: Omit<ToolCategory, 'id'>[] = [
  {
    name: 'Test Frontend Framework',
    description: 'Frontend frameworks for testing',
    color: '#FF4500'
  },
  {
    name: 'Test Backend Service',
    description: 'Backend services for testing',
    color: '#238636'
  },
  {
    name: 'Test Database',
    description: 'Database systems for testing',
    color: '#1F6FEB'
  }
];

export const testTools: Omit<Tool, 'id' | 'categoryId'>[] = [
  {
    name: 'Test React',
    description: 'A JavaScript library for building user interfaces - test version',
    url: 'https://reactjs.org',
    frameworks: ['React'],
    languages: ['JavaScript', 'TypeScript'],
    features: ['Component-based', 'Virtual DOM', 'Hooks'],
    integrations: ['Redux', 'Router', 'Testing Library'],
    maturityScore: 95,
    popularityScore: 95,
    pricing: 'Free (Open Source)',
    notes: 'Most popular frontend framework',
    setupComplexity: 'medium',
    costTier: 'free',
    performanceImpact: { buildTime: 'medium', bundleSize: 'medium' },
    apiLastSync: new Date('2024-01-15T10:00:00Z')
  },
  {
    name: 'Test Vue.js',
    description: 'Progressive JavaScript framework for building UIs - test version',
    url: 'https://vuejs.org',
    frameworks: ['Vue'],
    languages: ['JavaScript', 'TypeScript'],
    features: ['Progressive', 'Component-based', 'Reactive'],
    integrations: ['Vuex', 'Vue Router', 'Nuxt.js'],
    maturityScore: 90,
    popularityScore: 85,
    pricing: 'Free (Open Source)',
    notes: 'Easy to learn, great documentation',
    setupComplexity: 'easy',
    costTier: 'free',
    performanceImpact: { buildTime: 'low', bundleSize: 'small' },
    apiLastSync: new Date('2024-01-10T15:30:00Z')
  },
  {
    name: 'Test Express.js',
    description: 'Fast, unopinionated web framework for Node.js - test version',
    url: 'https://expressjs.com',
    frameworks: ['Express'],
    languages: ['JavaScript', 'TypeScript'],
    features: ['Minimal', 'Flexible', 'Middleware'],
    integrations: ['Node.js', 'MongoDB', 'PostgreSQL'],
    maturityScore: 92,
    popularityScore: 90,
    pricing: 'Free (Open Source)',
    notes: 'De facto standard for Node.js web apps',
    setupComplexity: 'easy',
    costTier: 'free',
    performanceImpact: { buildTime: 'low', bundleSize: 'small' },
    apiLastSync: new Date('2024-01-12T08:45:00Z')
  }
];

export const testCompatibilities: Omit<Compatibility, 'id' | 'toolOneId' | 'toolTwoId'>[] = [
  {
    compatibilityScore: 95,
    notes: 'React and Express work excellently together for full-stack development',
    verifiedIntegration: 1,
    integrationDifficulty: 'easy',
    setupSteps: [
      'Create React app with create-react-app',
      'Set up Express server in separate directory',
      'Configure proxy in package.json for development',
      'Set up API routes in Express',
      'Use fetch or axios in React to call API'
    ],
    codeExample: `// Express server
const express = require('express');
const app = express();

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// React component
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{data?.message}</div>;
}`,
    dependencies: ['cors', 'axios']
  },
  {
    compatibilityScore: 88,
    notes: 'Vue.js and Express.js integrate well for modern web applications',
    verifiedIntegration: 1,
    integrationDifficulty: 'easy',
    setupSteps: [
      'Create Vue app with Vue CLI or Vite',
      'Set up Express server',
      'Configure development proxy',
      'Create API endpoints',
      'Use axios or fetch in Vue components'
    ],
    codeExample: `// Vue component
<template>
  <div>{{ message }}</div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return { message: '' };
  },
  async mounted() {
    const response = await axios.get('/api/data');
    this.message = response.data.message;
  }
};
</script>`,
    dependencies: ['axios', 'cors']
  },
  {
    compatibilityScore: 75,
    notes: 'React and Vue.js can coexist but not typically used together',
    verifiedIntegration: 0,
    integrationDifficulty: 'hard',
    setupSteps: [
      'Consider micro-frontend architecture',
      'Use module federation or single-spa',
      'Separate build processes',
      'Careful state management between frameworks'
    ],
    codeExample: `// Not recommended - use one or the other
// Possible with micro-frontends but complex setup required`,
    dependencies: ['single-spa', '@module-federation/webpack']
  }
];

export const createTestData = async (storage: any) => {
  const categories = [];
  const tools = [];
  const compatibilities = [];

  // Create categories
  for (const categoryData of testCategories) {
    const category = await storage.createToolCategory(categoryData);
    categories.push(category);
  }

  // Create tools
  for (let i = 0; i < testTools.length; i++) {
    const toolData = {
      ...testTools[i],
      categoryId: categories[i % categories.length].id
    };
    const tool = await storage.createTool(toolData);
    tools.push(tool);
  }

  // Create compatibilities
  if (tools.length >= 2) {
    // React + Express
    const reactExpress = await storage.createCompatibility({
      ...testCompatibilities[0],
      toolOneId: tools[0].id,
      toolTwoId: tools[2].id
    });
    compatibilities.push(reactExpress);

    // Vue + Express
    if (tools.length >= 3) {
      const vueExpress = await storage.createCompatibility({
        ...testCompatibilities[1],
        toolOneId: tools[1].id,
        toolTwoId: tools[2].id
      });
      compatibilities.push(vueExpress);

      // React + Vue (not recommended)
      const reactVue = await storage.createCompatibility({
        ...testCompatibilities[2],
        toolOneId: tools[0].id,
        toolTwoId: tools[1].id
      });
      compatibilities.push(reactVue);
    }
  }

  return { categories, tools, compatibilities };
};

export const cleanupTestData = async (storage: any) => {
  try {
    await storage.clearAllCompatibilities();
    await storage.clearAllTools();
    // Note: We don't clear categories as they might be referenced
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
};