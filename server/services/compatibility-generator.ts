import { storage } from "../storage";
import { Tool, InsertCompatibility } from "@shared/schema";

export class CompatibilityGenerator {
  /**
   * Generate smart compatibility scores based on tool metadata
   */
  async generateCompatibilities() {
    console.log("Starting smart compatibility generation...");
    
    // Get all tools
    const tools = await storage.getTools();
    
    // Define patterns for non-tools
    const languageNames = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Perl', 'Scala', 'Haskell', 'Clojure', 'Elixir', 'Dart', 'R', 'Julia', 'Lua', 'MATLAB'];
    const resourcePatterns = ['awesome-', 'free-', '-books', 'book', 'tutorial', 'course', 'interview', 'roadmap', 'study', 'learning', 'education', 'curriculum', 'algorithms', 'design-patterns', 'cheat-sheet', 'collection', 'list-of', 'resources'];
    
    // Filter to only actual tools (not languages, books, or resource collections)
    const qualityTools = tools
      .filter(tool => {
        // Must have meaningful description
        if (!tool.description || tool.description.length < 20) return false;
        
        const nameLower = tool.name.toLowerCase();
        const descLower = tool.description.toLowerCase();
        
        // Exclude programming languages
        if (languageNames.some(lang => tool.name === lang || nameLower === lang.toLowerCase())) {
          return false;
        }
        
        // Exclude resource collections, books, tutorials
        if (resourcePatterns.some(pattern => 
          nameLower.includes(pattern) || 
          (pattern.length > 4 && descLower.includes(pattern))
        )) {
          return false;
        }
        
        // Exclude items that are clearly collections or lists
        if (descLower.includes('collection of') || 
            descLower.includes('list of') || 
            descLower.includes('awesome list') ||
            descLower.includes('freely available') ||
            descLower.includes('all algorithms')) {
          return false;
        }
        
        return true;
      });
    
    // Calculate compatibility scores for all tools first
    const toolCompatibilityMap = new Map<string, number>();
    
    for (const tool of qualityTools) {
      let totalScore = 0;
      let connectionCount = 0;
      
      for (const otherTool of qualityTools) {
        if (tool.id === otherTool.id) continue;
        
        const score = this.calculateCompatibilityScore(tool, otherTool);
        if (score !== 50) { // Count only non-neutral scores
          totalScore += Math.abs(score - 50); // How far from neutral
          connectionCount++;
        }
      }
      
      // Average deviation from neutral (higher = more connections)
      const avgDeviation = connectionCount > 0 ? totalScore / connectionCount : 0;
      toolCompatibilityMap.set(tool.id, avgDeviation);
    }
    
    // Filter to tools with meaningful connections (top 50 by connection strength)
    const connectedTools = qualityTools
      .filter(tool => toolCompatibilityMap.get(tool.id)! > 5) // Must have some meaningful connections
      .sort((a, b) => {
        const scoreA = toolCompatibilityMap.get(a.id)! + (a.features?.length || 0) * 2;
        const scoreB = toolCompatibilityMap.get(b.id)! + (b.features?.length || 0) * 2;
        return scoreB - scoreA;
      })
      .slice(0, 50); // Limit to top 50 most connected tools
    
    console.log(`Filtered to ${connectedTools.length} well-connected tools from ${tools.length} total`);
    
    // Clear all compatibilities in a single operation for better performance
    console.log(`Clearing existing compatibilities...`);
    await storage.clearAllCompatibilities();
    
    let generated = 0;
    let skipped = 0;
    
    // Generate compatibilities for connected tools only
    for (let i = 0; i < connectedTools.length; i++) {
      for (let j = i + 1; j < connectedTools.length; j++) {
        const toolOne = connectedTools[i];
        const toolTwo = connectedTools[j];
        
        try {
          // Calculate smart compatibility score
          const score = this.calculateCompatibilityScore(toolOne, toolTwo);
          
          // Save all scores (even neutral) for connected tools to have complete matrix
          const compatibility: InsertCompatibility = {
            toolOneId: toolOne.id,
            toolTwoId: toolTwo.id,
            compatibilityScore: score,
            notes: this.generateCompatibilityNotes(toolOne, toolTwo, score),
            verifiedIntegration: score >= 80 ? 1 : 0,
            // Align with schema defaults (easy|medium|hard)
            integrationDifficulty: score >= 70 ? "easy" : score >= 40 ? "medium" : "hard"
          };
          
          await storage.createCompatibility(compatibility);
          generated++;
        } catch (error) {
          console.error(`Failed to create compatibility for ${toolOne.name} - ${toolTwo.name}:`, error);
          skipped++;
        }
      }
    }
    
    // Remove tools with no connections from database
    const toolsToRemove = qualityTools.filter(tool => 
      !connectedTools.some(ct => ct.id === tool.id)
    );
    
    console.log(`Removing ${toolsToRemove.length} tools with no meaningful connections...`);
    for (const tool of toolsToRemove) {
      await storage.deleteTool(tool.id);
    }
    
    console.log(`Generated ${generated} compatibilities for ${connectedTools.length} connected tools`);
    return { generated, skipped: 0, totalTools: connectedTools.length };
  }
  
  /**
   * Calculate compatibility score based on tool characteristics
   */
  private calculateCompatibilityScore(toolOne: Tool, toolTwo: Tool): number {
    let score = 50; // Start neutral
    
    // Same category = usually compatible
    if (toolOne.categoryId === toolTwo.categoryId) {
      // But tools in same category might compete
      const competingCategories = ["ai-coding", "deployment"];
      if (competingCategories.includes(toolOne.categoryId)) {
        score -= 20; // Competing tools
      } else {
        score += 10; // Complementary tools in same space
      }
    }
    
    // Check language compatibility
    const languages1 = toolOne.languages || [];
    const languages2 = toolTwo.languages || [];
    const sharedLanguages = languages1.filter(l => languages2.includes(l));
    
    if (sharedLanguages.length > 0) {
      score += Math.min(sharedLanguages.length * 10, 30);
    } else if (languages1.length > 0 && languages2.length > 0) {
      score -= 10; // Different language ecosystems
    }
    
    // Check framework compatibility
    const frameworks1 = toolOne.frameworks || [];
    const frameworks2 = toolTwo.frameworks || [];
    const sharedFrameworks = frameworks1.filter(f => frameworks2.includes(f));
    
    if (sharedFrameworks.length > 0) {
      score += Math.min(sharedFrameworks.length * 15, 30);
    }
    
    // Category-based rules
    const categoryPairs = this.getCategoryCompatibilityRules();
    const pair = `${toolOne.categoryId}:${toolTwo.categoryId}`;
    const reversePair = `${toolTwo.categoryId}:${toolOne.categoryId}`;
    
    if (categoryPairs[pair]) {
      score = categoryPairs[pair];
    } else if (categoryPairs[reversePair]) {
      score = categoryPairs[reversePair];
    }
    
    // Specific tool relationships
    const toolRelationships = this.getKnownToolRelationships();
    const toolPair = `${toolOne.name}:${toolTwo.name}`;
    const reverseToolPair = `${toolTwo.name}:${toolOne.name}`;
    
    if (toolRelationships[toolPair]) {
      score = toolRelationships[toolPair];
    } else if (toolRelationships[reverseToolPair]) {
      score = toolRelationships[reverseToolPair];
    }
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate human-readable compatibility notes
   */
  private generateCompatibilityNotes(toolOne: Tool, toolTwo: Tool, score: number): string {
    const notes: string[] = [];
    
    if (score >= 80) {
      notes.push("Excellent compatibility");
      
      const sharedLangs = (toolOne.languages || []).filter(l => 
        (toolTwo.languages || []).includes(l)
      );
      if (sharedLangs.length > 0) {
        notes.push(`Share ${sharedLangs.join(", ")} support`);
      }
      
      const sharedFrameworks = (toolOne.frameworks || []).filter(f => 
        (toolTwo.frameworks || []).includes(f)
      );
      if (sharedFrameworks.length > 0) {
        notes.push(`Both work with ${sharedFrameworks.join(", ")}`);
      }
    } else if (score >= 60) {
      notes.push("Good compatibility with some configuration");
    } else if (score <= 30) {
      notes.push("Limited compatibility");
      if (toolOne.categoryId === toolTwo.categoryId) {
        notes.push("Competing solutions in same space");
      }
    } else {
      notes.push("Neutral compatibility");
    }
    
    return notes.join(". ");
  }
  
  /**
   * Define category-level compatibility rules
   */
  private getCategoryCompatibilityRules(): Record<string, number> {
    return {
      // Frontend + Backend = High compatibility
      "frontend-framework:backend-framework": 85,
      "frontend-framework:database": 75,
      "frontend-framework:deployment": 80,
      "frontend-framework:ai-coding": 70,
      
      // Backend + Database = High compatibility
      "backend-framework:database": 90,
      "backend-framework:deployment": 85,
      "backend-framework:monitoring": 80,
      "backend-framework:testing": 75,
      
      // AI tools work well with most things
      "ai-coding:frontend-framework": 75,
      "ai-coding:backend-framework": 75,
      "ai-coding:database": 65,
      
      // Deployment works with everything
      "deployment:database": 80,
      "deployment:monitoring": 85,
      "deployment:testing": 70,
      
      // Testing integrates well
      "testing:monitoring": 75,
      "testing:frontend-framework": 70,
      "testing:backend-framework": 70,
      
      // Competing categories
      "ai-coding:ai-coding": 30, // Competing AI tools
      "deployment:deployment": 25, // Competing platforms
      "database:database": 35, // Usually pick one database
      
      // Authentication + Everything
      "authentication:frontend-framework": 80,
      "authentication:backend-framework": 85,
      "authentication:database": 70,
    };
  }
  
  /**
   * Define specific tool relationships
   */
  private getKnownToolRelationships(): Record<string, number> {
    return {
      // Known excellent pairs
      "React:Next.js": 95,
      "React:Vite": 90,
      "React:Tailwind CSS": 95,
      "Next.js:Vercel": 98,
      "Next.js:Tailwind CSS": 95,
      "Vue:Vite": 95,
      "Vue:Nuxt": 98,
      "Node.js:Express": 95,
      "Node.js:PostgreSQL": 85,
      "TypeScript:React": 90,
      "TypeScript:Node.js": 95,
      "PostgreSQL:Drizzle": 90,
      "MongoDB:Mongoose": 95,
      "Docker:Kubernetes": 90,
      "GitHub:GitHub Actions": 98,
      "GitHub:Vercel": 85,
      
      // Known incompatible pairs
      "React:Angular": 20,
      "Vue:Angular": 20,
      "MySQL:PostgreSQL": 25,
      "npm:yarn": 30,
      "Webpack:Vite": 25,
      
      // Complementary AI tools
      "GitHub Copilot:ChatGPT": 75,
      "Cursor:GitHub Copilot": 70,
      
      // Database + ORM pairs
      "PostgreSQL:Prisma": 90,
      "MySQL:Prisma": 90,
      "SQLite:Prisma": 85,
      "PostgreSQL:TypeORM": 85,
      "MySQL:TypeORM": 85,
    };
  }
  
  /**
   * Clean up low-quality tools from database
   */
  async cleanupLowQualityTools() {
    const tools = await storage.getTools();
    let deleted = 0;
    
    for (const tool of tools) {
      // Delete tools with very poor data quality
      const shouldDelete = 
        (!tool.description || tool.description.length < 10) ||
        ((tool as any).popularityScore !== undefined && (tool as any).popularityScore < 10) ||
        ((tool as any).maturityScore !== undefined && (tool as any).maturityScore < 20) ||
        (!tool.features || tool.features.length === 0);
      
      if (shouldDelete) {
        await storage.deleteTool(tool.id);
        deleted++;
      }
    }
    
    console.log(`Deleted ${deleted} low-quality tools`);
    return deleted;
  }
}

export const compatibilityGenerator = new CompatibilityGenerator();