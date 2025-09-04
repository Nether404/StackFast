/**
 * StackFast Adapter Service
 * Bridges StackFast's tool profiles and blueprint generation with our compatibility matrix
 */

import { z } from 'zod';
import { InsertTool, Tool } from '@shared/schema';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

// StackFast's tool profile schema (imported from their schemas)
export const stackfastToolProfileSchema = z.object({
  tool_id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.array(z.string()),
  notable_strengths: z.array(z.string()).optional(),
  known_limitations: z.array(z.string()).optional(),
  output_types: z.array(z.string()).optional(),
  integrations: z.array(z.string()).optional(),
  license: z.string().nullable().optional(),
  maturity_score: z.number().min(0).max(1).nullable().optional(),
  popularity_score: z.number().min(0).max(1).nullable().optional(),
  last_updated: z.string().datetime(),
  schema_version: z.string(),
  requires_review: z.boolean().optional(),
  source_url: z.string().url().optional(),
  source_description: z.string().optional(),
  scraping_failed: z.boolean().optional(),
  established: z.string().optional(),
  default_use_case: z.string().optional(),
  llm_backends: z.array(z.string()).optional(),
  reviewed_at: z.string().datetime().optional(),
  reviewed_by: z.string().optional(),
  rejected_reason: z.string().optional(),
});

export type StackFastToolProfile = z.infer<typeof stackfastToolProfileSchema>;

// Blueprint schema from StackFast
export const blueprintSchema = z.object({
  title: z.string().default('Untitled Project'),
  techStack: z.string().optional().default(''),
  backendLogic: z.array(z.string()).default([]),
  frontendLogic: z.array(z.string()).default([]),
  recommendedWorkflow: z
    .object({
      name: z.string().default('Recommended Workflow'),
      stages: z.array(z.string()).default([]),
      reasoning: z.string().optional().default('')
    })
    .default({ name: 'Recommended Workflow', stages: [], reasoning: '' }),
  recommendedBackend: z.object({ name: z.string(), reasoning: z.string().optional().default('') }).optional(),
  recommendedFrontend: z.object({ name: z.string(), reasoning: z.string().optional().default('') }).optional(),
  recommendedBoilerplate: z.object({ name: z.string(), reasoning: z.string().optional().default('') }).optional(),
  marketGapAnalysis: z
    .object({
      segments: z.array(z.string()).default([]),
      competitors: z.array(z.string()).default([]),
      gaps: z.array(z.string()).default([]),
      validationPlan: z.array(z.string()).default([]),
    })
    .optional()
});

export type Blueprint = z.infer<typeof blueprintSchema>;

export class StackFastAdapter {
  /**
   * Convert StackFast tool profile to our tool schema
   */
  async convertToolProfile(stackfastTool: StackFastToolProfile): Promise<InsertTool> {
    // Get categories for mapping
    const categories = await storage.getToolCategories();
    
    // Map StackFast categories to our system
    const categoryMap = new Map<string, string>();
    categories.forEach(cat => {
      if (cat.name === "AI Coding Assistants") {
        categoryMap.set("Agentic Tool", cat.id);
        categoryMap.set("AI Assistant", cat.id);
      } else if (cat.name === "Development Environments") {
        categoryMap.set("Cloud IDE", cat.id);
        categoryMap.set("Code Editor", cat.id);
        categoryMap.set("Vibe Coding Tool", cat.id);
      } else if (cat.name === "No-Code/Low-Code") {
        categoryMap.set("No-Code Platform", cat.id);
        categoryMap.set("UI Builder", cat.id);
      }
    });

    const defaultCategoryId = categories.find(c => c.name === "Specialized Tools")?.id || categories[0]?.id || '';

    // Extract languages and frameworks from integrations/features
    const languages = this.extractLanguages(stackfastTool);
    const frameworks = this.extractFrameworks(stackfastTool);

    return {
      id: randomUUID(),
      name: stackfastTool.name,
      description: stackfastTool.description,
      categoryId: categoryMap.get(stackfastTool.category[0]) || defaultCategoryId,
      url: stackfastTool.source_url || null,
      frameworks,
      languages,
      features: stackfastTool.notable_strengths || [],
      integrations: stackfastTool.integrations || [],
      maturityScore: (stackfastTool.maturity_score || 0.5) * 10,
      popularityScore: (stackfastTool.popularity_score || 0.5) * 10,
      pricing: this.determinePricing(stackfastTool),
      notes: this.buildNotes(stackfastTool)
    };
  }

  /**
   * Enhance blueprint with compatibility insights
   */
  async enhanceBlueprint(blueprint: Blueprint, toolIds?: string[]): Promise<Blueprint & { compatibilityInsights: any }> {
    const compatibilityInsights: any = {
      overallHarmony: 0,
      toolCompatibilities: [],
      warnings: [],
      recommendations: []
    };

    if (!toolIds || toolIds.length < 2) {
      return { ...blueprint, compatibilityInsights };
    }

    // Analyze stack harmony
    const harmonyResult = await storage.getStackHarmonyScore(toolIds);
    compatibilityInsights.overallHarmony = harmonyResult.harmonyScore;

    // Get pairwise compatibilities
    for (let i = 0; i < toolIds.length; i++) {
      for (let j = i + 1; j < toolIds.length; j++) {
        const compat = await storage.getCompatibility(toolIds[i], toolIds[j]);
        if (compat) {
          const toolA = await storage.getTool(toolIds[i]);
          const toolB = await storage.getTool(toolIds[j]);
          
          compatibilityInsights.toolCompatibilities.push({
            toolA: toolA?.name,
            toolB: toolB?.name,
            score: compat.compatibilityScore,
            difficulty: compat.integrationDifficulty,
            notes: compat.notes
          });

          // Add warnings for low compatibility
          if (compat.compatibilityScore < 40) {
            compatibilityInsights.warnings.push(
              `Low compatibility between ${toolA?.name} and ${toolB?.name} (${compat.compatibilityScore}%). Consider alternatives.`
            );
          }
        }
      }
    }

    // Generate recommendations based on compatibility
    if (compatibilityInsights.overallHarmony < 50) {
      compatibilityInsights.recommendations.push(
        "Consider replacing tools with higher compatibility alternatives",
        "Review integration complexity before proceeding"
      );
    } else if (compatibilityInsights.overallHarmony > 80) {
      compatibilityInsights.recommendations.push(
        "Excellent tool synergy - proceed with confidence",
        "Integration should be straightforward"
      );
    }

    // Update blueprint recommendations with compatibility awareness
    if (blueprint.recommendedWorkflow) {
      blueprint.recommendedWorkflow.reasoning = 
        `${blueprint.recommendedWorkflow.reasoning} Stack harmony: ${compatibilityInsights.overallHarmony}%.`;
    }

    return { ...blueprint, compatibilityInsights };
  }

  /**
   * Generate tool recommendations for a blueprint
   */
  async recommendToolsForBlueprint(blueprint: Blueprint): Promise<Tool[]> {
    const recommendations: Tool[] = [];
    const allTools = await storage.getToolsWithCategory();

    // Parse tech stack to identify needed tool categories
    const techStackLower = (blueprint.techStack || '').toLowerCase();
    const neededCategories: string[] = [];

    if (techStackLower.includes('react') || techStackLower.includes('vue') || techStackLower.includes('frontend')) {
      neededCategories.push('Frontend & Design');
    }
    if (techStackLower.includes('backend') || techStackLower.includes('api') || techStackLower.includes('database')) {
      neededCategories.push('Backend & Infrastructure');
    }
    if (techStackLower.includes('ai') || techStackLower.includes('llm') || techStackLower.includes('ml')) {
      neededCategories.push('AI Coding Assistants');
    }
    if (techStackLower.includes('deploy') || techStackLower.includes('hosting')) {
      neededCategories.push('Development Environments');
    }

    // Find tools matching needed categories
    for (const categoryName of neededCategories) {
      const category = await storage.getToolCategories();
      const categoryId = category.find(c => c.name === categoryName)?.id;
      
      if (categoryId) {
        const categoryTools = allTools
          .filter(t => t.categoryId === categoryId)
          .sort((a, b) => (b.popularityScore + b.maturityScore) - (a.popularityScore + a.maturityScore))
          .slice(0, 2); // Top 2 tools per category
        
        recommendations.push(...categoryTools);
      }
    }

    // Deduplicate recommendations
    const uniqueTools = Array.from(new Map(recommendations.map(t => [t.id, t])).values());

    return uniqueTools;
  }

  private extractLanguages(tool: StackFastToolProfile): string[] {
    const languages: Set<string> = new Set();
    
    // Check integrations and features for language hints
    const allText = [
      ...(tool.integrations || []),
      ...(tool.notable_strengths || []),
      tool.description
    ].join(' ').toLowerCase();

    if (allText.includes('javascript') || allText.includes('js')) languages.add('JavaScript');
    if (allText.includes('typescript') || allText.includes('ts')) languages.add('TypeScript');
    if (allText.includes('python')) languages.add('Python');
    if (allText.includes('java')) languages.add('Java');
    if (allText.includes('go') || allText.includes('golang')) languages.add('Go');
    if (allText.includes('rust')) languages.add('Rust');
    if (allText.includes('c++') || allText.includes('cpp')) languages.add('C++');
    if (allText.includes('ruby')) languages.add('Ruby');

    return Array.from(languages);
  }

  private extractFrameworks(tool: StackFastToolProfile): string[] {
    const frameworks: Set<string> = new Set();
    
    const allText = [
      ...(tool.integrations || []),
      ...(tool.notable_strengths || []),
      tool.description
    ].join(' ').toLowerCase();

    if (allText.includes('react')) frameworks.add('React');
    if (allText.includes('vue')) frameworks.add('Vue');
    if (allText.includes('angular')) frameworks.add('Angular');
    if (allText.includes('next')) frameworks.add('Next.js');
    if (allText.includes('tailwind')) frameworks.add('Tailwind CSS');
    if (allText.includes('express')) frameworks.add('Express');
    if (allText.includes('django')) frameworks.add('Django');
    if (allText.includes('flask')) frameworks.add('Flask');

    return Array.from(frameworks);
  }

  private determinePricing(tool: StackFastToolProfile): string {
    // Estimate pricing based on tool characteristics
    if (tool.name.toLowerCase().includes('open source')) {
      return 'Free and open source';
    }
    if (tool.maturity_score && tool.maturity_score > 0.8) {
      return 'Enterprise pricing available';
    }
    return 'Pricing varies - check website for details';
  }

  private buildNotes(tool: StackFastToolProfile): string {
    const parts: string[] = ['Imported from StackFast'];
    
    if (tool.known_limitations && tool.known_limitations.length > 0) {
      parts.push(`Limitations: ${tool.known_limitations.join(', ')}`);
    }
    
    if (tool.output_types && tool.output_types.length > 0) {
      parts.push(`Output types: ${tool.output_types.join(', ')}`);
    }
    
    if (tool.default_use_case) {
      parts.push(`Default use case: ${tool.default_use_case}`);
    }
    
    if (tool.established) {
      parts.push(`Established: ${tool.established}`);
    }

    return parts.join('. ');
  }
}

export const stackfastAdapter = new StackFastAdapter();