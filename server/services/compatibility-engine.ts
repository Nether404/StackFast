import { type Tool } from "@shared/schema";

export interface CompatibilityResult {
  toolOneId: string;
  toolTwoId: string;
  compatibilityScore: number;
  notes: string;
  verifiedIntegration: number;
  integrationDifficulty: "easy" | "medium" | "hard";
  setupSteps: string[];
  dependencies: string[];
}

/**
 * Intelligent compatibility scoring engine that analyzes tool relationships
 * based on categories, frameworks, languages, features, and integrations
 */
export class CompatibilityEngine {
  
  /**
   * Calculate compatibility score between two tools (0-100)
   */
  calculateCompatibility(toolA: Tool, toolB: Tool): CompatibilityResult {
    let score = 50; // Start with neutral score
    const notes: string[] = [];
    const setupSteps: string[] = [];
    const dependencies: string[] = [];
    
    // Category compatibility (25% weight)
    const categoryScore = this.calculateCategoryCompatibility(toolA, toolB);
    score += categoryScore * 0.25;
    if (categoryScore > 0) {
      notes.push(`Same category tools (${categoryScore > 20 ? 'high' : 'moderate'} synergy)`);
    }
    
    // Framework compatibility (20% weight) 
    const frameworkScore = this.calculateFrameworkCompatibility(toolA, toolB);
    score += frameworkScore * 0.20;
    if (frameworkScore > 0) {
      notes.push(`Shared framework support`);
    }
    
    // Language compatibility (15% weight)
    const languageScore = this.calculateLanguageCompatibility(toolA, toolB);
    score += languageScore * 0.15;
    if (languageScore > 0) {
      notes.push(`Common programming languages`);
    }
    
    // Integration compatibility (20% weight)
    const integrationScore = this.calculateIntegrationCompatibility(toolA, toolB);
    score += integrationScore * 0.20;
    if (integrationScore > 0) {
      notes.push(`Mutual integration support`);
      setupSteps.push(`Configure ${toolA.name} and ${toolB.name} integration`);
    }
    
    // Feature complementarity (15% weight)
    const featureScore = this.calculateFeatureCompatibility(toolA, toolB);
    score += featureScore * 0.15;
    if (featureScore > 0) {
      notes.push(`Complementary feature sets`);
    }
    
    // Maturity alignment (5% weight)
    const maturityScore = this.calculateMaturityAlignment(toolA, toolB);
    score += maturityScore * 0.05;
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    // Determine integration difficulty
    const difficulty = this.determineIntegrationDifficulty(score, toolA, toolB);
    
    // Generate setup steps
    const generatedSteps = this.generateSetupSteps(toolA, toolB, difficulty);
    setupSteps.push(...generatedSteps);
    
    // Generate dependencies
    const generatedDeps = this.generateDependencies(toolA, toolB);
    dependencies.push(...generatedDeps);
    
    return {
      toolOneId: toolA.id,
      toolTwoId: toolB.id,
      compatibilityScore: Math.round(score * 10) / 10,
      notes: notes.join('; '),
      verifiedIntegration: integrationScore > 30 ? 1 : 0,
      integrationDifficulty: difficulty,
      setupSteps,
      dependencies
    };
  }
  
  private calculateCategoryCompatibility(toolA: Tool, toolB: Tool): number {
    if (toolA.categoryId === toolB.categoryId) {
      return 30; // Same category = high compatibility
    }
    
    // Specific category combinations that work well together
    const synergisticPairs = new Map([
      ['AI Coding Assistants', ['Development Environments', 'Frontend & Design']],
      ['Development Environments', ['AI Coding Assistants', 'Backend & Infrastructure']],
      ['Frontend & Design', ['Backend & Infrastructure', 'AI Coding Assistants']],
      ['Backend & Infrastructure', ['Frontend & Design', 'Payment & Commerce']],
      ['No-Code/Low-Code', ['Backend & Infrastructure', 'Payment & Commerce']]
    ]);
    
    // This would need category names, for now use simplified logic
    return 10; // Different categories = moderate compatibility
  }
  
  private calculateFrameworkCompatibility(toolA: Tool, toolB: Tool): number {
    const frameworksA = toolA.frameworks || [];
    const frameworksB = toolB.frameworks || [];
    
    if (frameworksA.length === 0 || frameworksB.length === 0) return 0;
    
    const sharedFrameworks = frameworksA.filter(f => frameworksB.includes(f));
    const compatibilityRatio = sharedFrameworks.length / Math.max(frameworksA.length, frameworksB.length);
    
    return compatibilityRatio * 40; // Up to 40 points for perfect framework overlap
  }
  
  private calculateLanguageCompatibility(toolA: Tool, toolB: Tool): number {
    const languagesA = toolA.languages || [];
    const languagesB = toolB.languages || [];
    
    if (languagesA.length === 0 || languagesB.length === 0) return 0;
    
    const sharedLanguages = languagesA.filter(l => languagesB.includes(l));
    const compatibilityRatio = sharedLanguages.length / Math.max(languagesA.length, languagesB.length);
    
    return compatibilityRatio * 30; // Up to 30 points for perfect language overlap
  }
  
  private calculateIntegrationCompatibility(toolA: Tool, toolB: Tool): number {
    const integrationsA = toolA.integrations || [];
    const integrationsB = toolB.integrations || [];
    
    if (integrationsA.length === 0 || integrationsB.length === 0) return 0;
    
    // Check for mutual mentions (A integrates with B or vice versa)
    const mutualIntegration = integrationsA.some(i => 
      i.toLowerCase().includes(toolB.name.toLowerCase())
    ) || integrationsB.some(i => 
      i.toLowerCase().includes(toolA.name.toLowerCase())
    );
    
    if (mutualIntegration) return 50; // High score for direct integration
    
    // Check for common third-party integrations
    const commonIntegrations = integrationsA.filter(i => integrationsB.includes(i));
    const compatibilityRatio = commonIntegrations.length / Math.max(integrationsA.length, integrationsB.length);
    
    return compatibilityRatio * 35; // Up to 35 points for common integrations
  }
  
  private calculateFeatureCompatibility(toolA: Tool, toolB: Tool): number {
    const featuresA = toolA.features || [];
    const featuresB = toolB.features || [];
    
    if (featuresA.length === 0 || featuresB.length === 0) return 0;
    
    // Check for complementary features (different but related)
    const complementaryPairs = [
      ['code generation', 'debugging'],
      ['UI design', 'backend'],
      ['hosting', 'database'],
      ['authentication', 'database'],
      ['payment processing', 'user management']
    ];
    
    let complementaryScore = 0;
    for (const [featureA, featureB] of complementaryPairs) {
      const hasA = featuresA.some(f => f.toLowerCase().includes(featureA));
      const hasB = featuresB.some(f => f.toLowerCase().includes(featureB));
      if (hasA && hasB) complementaryScore += 15;
    }
    
    // Avoid feature overlap (competing tools score lower)
    const sharedFeatures = featuresA.filter(f => 
      featuresB.some(fb => fb.toLowerCase().includes(f.toLowerCase()))
    );
    const overlapPenalty = sharedFeatures.length * 5;
    
    return Math.max(0, complementaryScore - overlapPenalty);
  }
  
  private calculateMaturityAlignment(toolA: Tool, toolB: Tool): number {
    const maturityDiff = Math.abs(toolA.maturityScore - toolB.maturityScore);
    // Lower difference = better alignment, max 10 points
    return Math.max(0, 10 - maturityDiff);
  }
  
  private determineIntegrationDifficulty(score: number, toolA: Tool, toolB: Tool): "easy" | "medium" | "hard" {
    if (score >= 75) return "easy";
    if (score >= 55) return "medium";
    return "hard";
  }
  
  private generateSetupSteps(toolA: Tool, toolB: Tool, difficulty: string): string[] {
    const steps = [];
    
    if (difficulty === "hard") {
      steps.push(`Research compatibility requirements between ${toolA.name} and ${toolB.name}`);
      steps.push(`Set up development environment with both tools`);
      steps.push(`Create proof of concept integration`);
    } else if (difficulty === "medium") {
      steps.push(`Install and configure both ${toolA.name} and ${toolB.name}`);
      steps.push(`Follow integration documentation`);
    } else {
      steps.push(`Install ${toolA.name} and ${toolB.name} packages`);
      steps.push(`Configure basic integration settings`);
    }
    
    steps.push(`Test integration functionality`);
    return steps;
  }
  
  private generateDependencies(toolA: Tool, toolB: Tool): string[] {
    const deps = [];
    
    // Extract common frameworks/languages as dependencies
    const commonFrameworks = (toolA.frameworks || []).filter(f => 
      (toolB.frameworks || []).includes(f)
    );
    const commonLanguages = (toolA.languages || []).filter(l => 
      (toolB.languages || []).includes(l)
    );
    
    deps.push(...commonFrameworks.map(f => f.toLowerCase()));
    deps.push(...commonLanguages.map(l => `${l.toLowerCase()}-runtime`));
    
    return Array.from(new Set(deps)).slice(0, 5); // Limit to 5 unique deps
  }
}