/**
 * Blueprint Generator Service
 * Integrates StackFast's blueprint generation with our compatibility matrix
 */

import { z } from 'zod';
import { storage } from '../storage';
import { stackfastAdapter } from './stackfast-adapter';
import { CompatibilityEngine } from './compatibility-engine';

const blueprintRequestSchema = z.object({
  rawIdea: z.string().min(1),
  preferredTools: z.array(z.string()).optional(),
  avoidTools: z.array(z.string()).optional(),
  budget: z.enum(['low', 'medium', 'high', 'enterprise']).optional(),
  timeline: z.enum(['prototype', 'mvp', 'production']).optional()
});

export type BlueprintRequest = z.infer<typeof blueprintRequestSchema>;

export interface EnhancedBlueprint {
  title: string;
  techStack: string;
  backendLogic: string[];
  frontendLogic: string[];
  recommendedWorkflow: {
    name: string;
    stages: string[];
    reasoning: string;
  };
  recommendedTools: {
    tool: string;
    category: string;
    reason: string;
    compatibilityScore?: number;
  }[];
  stackAnalysis: {
    harmonyScore: number;
    totalTools: number;
    conflicts: string[];
    warnings: string[];
    integrationComplexity: 'low' | 'medium' | 'high';
  };
  alternativeStacks?: {
    name: string;
    tools: string[];
    harmonyScore: number;
    tradeoffs: string;
  }[];
  estimatedTimeline?: {
    development: string;
    testing: string;
    deployment: string;
  };
  costEstimate?: {
    tooling: string;
    infrastructure: string;
    maintenance: string;
  };
}

export class BlueprintGenerator {
  private compatibilityEngine: CompatibilityEngine;

  constructor() {
    this.compatibilityEngine = new CompatibilityEngine();
  }

  /**
   * Generate an enhanced blueprint with compatibility awareness
   */
  async generateBlueprint(request: BlueprintRequest): Promise<EnhancedBlueprint> {
    // Get all available tools
    const allTools = await storage.getToolsWithCategory();
    
    // Analyze the idea to determine needed tool categories
    const neededCategories = this.analyzeIdea(request.rawIdea);
    
    // Select optimal tools based on compatibility
    const selectedTools = await this.selectOptimalTools(
      neededCategories,
      allTools,
      request.preferredTools,
      request.avoidTools
    );

    // Generate the base blueprint structure
    const blueprint = this.createBaseBlueprint(request.rawIdea, selectedTools);

    // Analyze stack compatibility
    const stackAnalysis = await this.analyzeStackCompatibility(selectedTools.map(t => t.id));

    // Generate alternative stacks if harmony is low
    let alternativeStacks;
    if (stackAnalysis.harmonyScore < 60) {
      alternativeStacks = await this.generateAlternativeStacks(
        neededCategories,
        allTools,
        request.avoidTools
      );
    }

    // Calculate timeline and cost estimates
    const estimatedTimeline = this.estimateTimeline(request.timeline || 'mvp', stackAnalysis.integrationComplexity);
    const costEstimate = this.estimateCosts(selectedTools, request.budget || 'medium');

    // Build the enhanced blueprint
    const enhancedBlueprint: EnhancedBlueprint = {
      ...blueprint,
      recommendedTools: selectedTools.map(tool => ({
        tool: tool.name,
        category: tool.categoryName || 'General',
        reason: this.getToolRecommendationReason(tool, request.rawIdea),
        compatibilityScore: tool.avgCompatibilityScore
      })),
      stackAnalysis,
      alternativeStacks,
      estimatedTimeline,
      costEstimate
    };

    return enhancedBlueprint;
  }

  /**
   * Analyze idea to determine needed tool categories
   */
  private analyzeIdea(idea: string): string[] {
    const ideaLower = (idea || '').toLowerCase();
    const categories: string[] = [];

    // Frontend needs
    if (ideaLower.includes('web') || ideaLower.includes('app') || ideaLower.includes('ui') || 
        ideaLower.includes('dashboard') || ideaLower.includes('mobile')) {
      categories.push('Frontend & Design');
    }

    // Backend needs
    if (ideaLower.includes('api') || ideaLower.includes('database') || ideaLower.includes('backend') ||
        ideaLower.includes('server') || ideaLower.includes('auth')) {
      categories.push('Backend & Infrastructure');
    }

    // AI/ML needs
    if (ideaLower.includes('ai') || ideaLower.includes('ml') || ideaLower.includes('llm') ||
        ideaLower.includes('chatbot') || ideaLower.includes('intelligent')) {
      categories.push('AI Coding Assistants');
    }

    // Development environment needs
    if (ideaLower.includes('deploy') || ideaLower.includes('host') || ideaLower.includes('cloud')) {
      categories.push('Development Environments');
    }

    // No-code/Low-code for rapid prototyping
    if (ideaLower.includes('prototype') || ideaLower.includes('mvp') || ideaLower.includes('quick')) {
      categories.push('No-Code/Low-Code');
    }

    // Payment processing
    if (ideaLower.includes('payment') || ideaLower.includes('subscription') || ideaLower.includes('commerce')) {
      categories.push('Payment & Commerce');
    }

    // Default to general development if no specific needs identified
    if (categories.length === 0) {
      categories.push('Development Environments', 'Frontend & Design', 'Backend & Infrastructure');
    }

    return categories;
  }

  /**
   * Select optimal tools based on compatibility
   */
  private async selectOptimalTools(
    neededCategories: string[],
    allTools: any[],
    preferredTools?: string[],
    avoidTools?: string[]
  ): Promise<any[]> {
    const selectedTools: any[] = [];
    const categories = await storage.getToolCategories();

    for (const categoryName of neededCategories) {
      const category = categories.find(c => c.name === categoryName);
      if (!category) continue;

      // Get tools in this category
      let categoryTools = allTools.filter(t => t.categoryId === category.id);

      // Filter out avoided tools
      if (avoidTools && avoidTools.length > 0) {
        categoryTools = categoryTools.filter(t => !avoidTools.includes(t.name));
      }

      // Prioritize preferred tools
      if (preferredTools && preferredTools.length > 0) {
        const preferred = categoryTools.filter(t => preferredTools.includes(t.name));
        if (preferred.length > 0) {
          selectedTools.push(...preferred);
          continue;
        }
      }

      // Select best tool based on score and compatibility with already selected tools
      let bestTool = null;
      let bestScore = -1;

      for (const tool of categoryTools) {
        let score = tool.popularityScore + tool.maturityScore;
        
        // Calculate average compatibility with already selected tools
        if (selectedTools.length > 0) {
          let compatSum = 0;
          let compatCount = 0;
          
          for (const selected of selectedTools) {
            const compat = await storage.getCompatibility(tool.id, selected.id);
            if (compat) {
              compatSum += compat.compatibilityScore;
              compatCount++;
            }
          }
          
          if (compatCount > 0) {
            const avgCompat = compatSum / compatCount;
            score += avgCompat / 10; // Add compatibility bonus
            tool.avgCompatibilityScore = avgCompat;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestTool = tool;
          bestTool.categoryName = category.name;
        }
      }

      if (bestTool) {
        selectedTools.push(bestTool);
      }
    }

    return selectedTools;
  }

  /**
   * Create base blueprint structure
   */
  private createBaseBlueprint(idea: string, tools: any[]): any {
    const toolNames = tools.map(t => t.name).join(', ');
    
    return {
      title: this.generateTitle(idea),
      techStack: `${toolNames}`,
      backendLogic: this.generateBackendLogic(idea, tools),
      frontendLogic: this.generateFrontendLogic(idea, tools),
      recommendedWorkflow: {
        name: 'Compatibility-Optimized Workflow',
        stages: this.generateWorkflowStages(idea, tools),
        reasoning: `Selected tools with high compatibility scores to minimize integration complexity. Average stack harmony ensures smooth development.`
      }
    };
  }

  /**
   * Analyze stack compatibility
   */
  private async analyzeStackCompatibility(toolIds: string[]): Promise<any> {
    if (toolIds.length < 2) {
      return {
        harmonyScore: 100,
        totalTools: toolIds.length,
        conflicts: [],
        warnings: [],
        integrationComplexity: 'low' as const
      };
    }

    const result = await storage.validateStack(toolIds);
    const harmonyResult = await storage.getStackHarmonyScore(toolIds);

    // Determine integration complexity
    let integrationComplexity: 'low' | 'medium' | 'high' = 'low';
    if (harmonyResult.harmonyScore < 40) {
      integrationComplexity = 'high';
    } else if (harmonyResult.harmonyScore < 70) {
      integrationComplexity = 'medium';
    }

    return {
      harmonyScore: harmonyResult.harmonyScore,
      totalTools: toolIds.length,
      conflicts: result.conflicts,
      warnings: result.dependencies,
      integrationComplexity
    };
  }

  /**
   * Generate alternative stacks with better compatibility
   */
  private async generateAlternativeStacks(
    neededCategories: string[],
    allTools: any[],
    avoidTools?: string[]
  ): Promise<any[]> {
    const alternatives: any[] = [];
    
    // Try different tool combinations
    for (let i = 0; i < 2; i++) {
      const altTools = await this.selectOptimalTools(
        neededCategories,
        allTools.sort(() => Math.random() - 0.5), // Randomize for variety
        [],
        avoidTools
      );

      if (altTools.length > 0) {
        const harmonyResult = await storage.getStackHarmonyScore(altTools.map(t => t.id));
        
        alternatives.push({
          name: `Alternative Stack ${i + 1}`,
          tools: altTools.map(t => t.name),
          harmonyScore: harmonyResult.harmonyScore,
          tradeoffs: this.generateTradeoffs(altTools)
        });
      }
    }

    return alternatives.sort((a, b) => b.harmonyScore - a.harmonyScore);
  }

  // Helper methods
  private generateTitle(idea: string): string {
    if (!idea || idea.trim() === '') {
      return 'Tech Stack Blueprint';
    }
    const words = idea.split(' ').slice(0, 5);
    const title = words.join(' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  private generateBackendLogic(idea: string, tools: any[]): string[] {
    const logic = [
      'Set up database schema and migrations',
      'Implement authentication and authorization',
      'Create RESTful API endpoints',
      'Set up data validation and error handling',
      'Implement business logic layer'
    ];

    // Add tool-specific logic
    if (tools.some(t => t.name.includes('Supabase'))) {
      logic.push('Configure Supabase real-time subscriptions');
    }
    if (tools.some(t => t.name.includes('Firebase'))) {
      logic.push('Set up Firebase cloud functions');
    }

    return logic;
  }

  private generateFrontendLogic(idea: string, tools: any[]): string[] {
    const logic = [
      'Design responsive UI components',
      'Implement state management',
      'Set up routing and navigation',
      'Create forms with validation',
      'Add loading states and error handling'
    ];

    // Add tool-specific logic
    if (tools.some(t => t.name.includes('React'))) {
      logic.push('Configure React hooks and context');
    }
    if (tools.some(t => t.name.includes('v0'))) {
      logic.push('Generate UI components with v0');
    }

    return logic;
  }

  private generateWorkflowStages(idea: string, tools: any[]): string[] {
    return [
      'Set up development environment',
      'Initialize project with selected tools',
      'Build core functionality',
      'Integrate tools and services',
      'Test compatibility and performance',
      'Deploy to production'
    ];
  }

  private getToolRecommendationReason(tool: any, idea: string): string {
    const reasons: Record<string, string> = {
      'Replit': 'Instant development environment with built-in hosting',
      'Cursor IDE': 'AI-powered coding assistance for faster development',
      'Supabase': 'Complete backend solution with real-time features',
      'ChatGPT': 'AI integration for intelligent features',
      'GitHub Copilot': 'Code completion to accelerate development',
      'Bolt.new': 'Rapid prototyping with AI generation',
      'v0': 'Quick UI component generation'
    };

    return reasons[tool.name] || `High compatibility score (${tool.avgCompatibilityScore || 'N/A'}%) with selected stack`;
  }

  private estimateTimeline(scope: string, complexity: string): any {
    const timelines: Record<string, Record<string, any>> = {
      prototype: {
        low: { development: '1-2 weeks', testing: '2-3 days', deployment: '1 day' },
        medium: { development: '2-3 weeks', testing: '3-5 days', deployment: '2 days' },
        high: { development: '3-4 weeks', testing: '1 week', deployment: '3 days' }
      },
      mvp: {
        low: { development: '4-6 weeks', testing: '1 week', deployment: '2-3 days' },
        medium: { development: '6-8 weeks', testing: '2 weeks', deployment: '3-5 days' },
        high: { development: '8-12 weeks', testing: '3 weeks', deployment: '1 week' }
      },
      production: {
        low: { development: '2-3 months', testing: '3-4 weeks', deployment: '1 week' },
        medium: { development: '3-4 months', testing: '4-6 weeks', deployment: '2 weeks' },
        high: { development: '4-6 months', testing: '6-8 weeks', deployment: '3 weeks' }
      }
    };

    return timelines[scope]?.[complexity] || timelines.mvp.medium;
  }

  private estimateCosts(tools: any[], budget: string): any {
    let toolingCost = 0;
    
    // Estimate monthly tooling costs
    for (const tool of tools) {
      if (tool.pricing?.includes('$')) {
        const match = tool.pricing.match(/\$(\d+)/);
        if (match) {
          toolingCost += parseInt(match[1]);
        }
      }
    }

    const costEstimates: Record<string, any> = {
      low: {
        tooling: `$${toolingCost}/month`,
        infrastructure: '$50-100/month',
        maintenance: '$500-1000/month'
      },
      medium: {
        tooling: `$${toolingCost * 2}/month`,
        infrastructure: '$200-500/month',
        maintenance: '$2000-5000/month'
      },
      high: {
        tooling: `$${toolingCost * 5}/month`,
        infrastructure: '$1000-3000/month',
        maintenance: '$5000-15000/month'
      },
      enterprise: {
        tooling: 'Custom pricing',
        infrastructure: '$5000+/month',
        maintenance: '$20000+/month'
      }
    };

    return costEstimates[budget] || costEstimates.medium;
  }

  private generateTradeoffs(tools: any[]): string {
    const tradeoffs: string[] = [];
    
    const avgMaturity = tools.reduce((sum, t) => sum + t.maturityScore, 0) / tools.length;
    if (avgMaturity < 7) {
      tradeoffs.push('Lower maturity - may encounter more bugs');
    }
    
    const avgPopularity = tools.reduce((sum, t) => sum + t.popularityScore, 0) / tools.length;
    if (avgPopularity < 7) {
      tradeoffs.push('Less popular tools - smaller community support');
    }
    
    if (tools.some(t => t.pricing?.includes('Enterprise'))) {
      tradeoffs.push('Higher cost for enterprise features');
    }

    return tradeoffs.join(', ') || 'Well-balanced stack with minimal tradeoffs';
  }
}

export const blueprintGenerator = new BlueprintGenerator();