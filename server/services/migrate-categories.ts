import { db } from "../db";
import { tools, toolCategories, toolCategoryJunction } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function migrateToMultipleCategories() {
  console.log("Starting migration to multiple categories...");
  
  try {
    // Get all tools and categories
    const allTools = await db.select().from(tools);
    const allCategories = await db.select().from(toolCategories);
    
    // Create a map of category names to IDs for quick lookup
    const categoryMap = new Map<string, string>();
    allCategories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    });
    
    // Define category detection patterns
    const categoryPatterns = {
      'AI Coding': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'copilot', 'assistant', 'code generation'],
      'Frontend/Design': ['frontend', 'ui', 'ux', 'design', 'css', 'styling', 'component', 'react', 'vue', 'angular', 'svelte'],
      'Backend/Database': ['backend', 'database', 'api', 'server', 'sql', 'nosql', 'orm', 'rest', 'graphql', 'microservice'],
      'DevOps/Infrastructure': ['devops', 'ci/cd', 'deployment', 'docker', 'kubernetes', 'infrastructure', 'monitoring', 'logging'],
      'Testing/QA': ['testing', 'test', 'qa', 'quality', 'e2e', 'unit test', 'integration test', 'cypress', 'jest'],
      'Full-Stack': ['full-stack', 'fullstack', 'full stack', 'framework', 'nextjs', 'nuxt', 'remix', 'sveltekit'],
      'Mobile': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
      'Analytics': ['analytics', 'metrics', 'tracking', 'data analysis', 'reporting', 'dashboard'],
      'Authentication': ['auth', 'authentication', 'authorization', 'identity', 'oauth', 'jwt', 'sso'],
      'Content Management': ['cms', 'content management', 'headless', 'blog', 'wordpress', 'strapi'],
      'Version Control': ['version control', 'git', 'github', 'gitlab', 'bitbucket', 'source control'],
      'Documentation': ['documentation', 'docs', 'api documentation', 'swagger', 'readme'],
      'Collaboration': ['collaboration', 'team', 'communication', 'chat', 'project management'],
      'Security': ['security', 'encryption', 'vulnerability', 'penetration', 'firewall', 'ssl'],
      'Performance': ['performance', 'optimization', 'caching', 'cdn', 'speed', 'lazy loading'],
      'Cloud Services': ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'lambda', 'functions'],
      'Payment': ['payment', 'billing', 'subscription', 'stripe', 'paypal', 'checkout'],
      'Email': ['email', 'smtp', 'mail', 'newsletter', 'transactional'],
      'Search': ['search', 'elasticsearch', 'algolia', 'indexing', 'full-text'],
      'Other': []
    };
    
    let migratedCount = 0;
    
    for (const tool of allTools) {
      const detectedCategories = new Set<string>();
      
      // Always add the primary category
      if (tool.categoryId) {
        detectedCategories.add(tool.categoryId);
      }
      
      // Analyze tool properties to detect additional categories
      const searchText = `${tool.name} ${tool.description} ${tool.features?.join(' ')} ${tool.frameworks?.join(' ')}`.toLowerCase();
      
      for (const [categoryName, patterns] of Object.entries(categoryPatterns)) {
        const categoryId = categoryMap.get(categoryName.toLowerCase());
        if (!categoryId) continue;
        
        // Check if any pattern matches
        const hasMatch = patterns.some(pattern => searchText.includes(pattern.toLowerCase()));
        
        if (hasMatch) {
          detectedCategories.add(categoryId);
        }
      }
      
      // Special detection for tools that might belong to multiple categories
      // Frontend frameworks that are also full-stack
      if (tool.name.toLowerCase().includes('next') || tool.name.toLowerCase().includes('nuxt') || tool.name.toLowerCase().includes('remix')) {
        const frontendId = categoryMap.get('frontend/design');
        const fullstackId = categoryMap.get('full-stack');
        if (frontendId) detectedCategories.add(frontendId);
        if (fullstackId) detectedCategories.add(fullstackId);
      }
      
      // Database tools that are also backend
      if (searchText.includes('database') || searchText.includes('orm') || searchText.includes('sql')) {
        const backendId = categoryMap.get('backend/database');
        if (backendId) detectedCategories.add(backendId);
      }
      
      // AI tools that are also coding tools
      if (searchText.includes('copilot') || searchText.includes('code ai') || searchText.includes('coding assistant')) {
        const aiId = categoryMap.get('ai coding');
        if (aiId) detectedCategories.add(aiId);
      }
      
      // Testing tools that might also be DevOps
      if (searchText.includes('ci') || searchText.includes('continuous integration')) {
        const devopsId = categoryMap.get('devops/infrastructure');
        const testingId = categoryMap.get('testing/qa');
        if (devopsId) detectedCategories.add(devopsId);
        if (testingId) detectedCategories.add(testingId);
      }
      
      // Insert junction records for each detected category
      const categoriesArray = Array.from(detectedCategories);
      for (let i = 0; i < categoriesArray.length; i++) {
        const categoryId = categoriesArray[i];
        
        // Check if junction already exists
        const existing = await db.select()
          .from(toolCategoryJunction)
          .where(and(
            eq(toolCategoryJunction.toolId, tool.id),
            eq(toolCategoryJunction.categoryId, categoryId)
          ));
        
        if (existing.length === 0) {
          await db.insert(toolCategoryJunction).values({
            toolId: tool.id,
            categoryId: categoryId,
            isPrimary: categoryId === tool.categoryId // Mark primary category
          });
        }
      }
      
      migratedCount++;
      if (migratedCount % 10 === 0) {
        console.log(`Migrated ${migratedCount}/${allTools.length} tools...`);
      }
    }
    
    console.log(`Migration complete! Processed ${migratedCount} tools.`);
    
    // Show statistics
    const junctionRecords = await db.select().from(toolCategoryJunction);
    const toolsWithMultiple = new Map<string, number>();
    
    junctionRecords.forEach(record => {
      const count = toolsWithMultiple.get(record.toolId) || 0;
      toolsWithMultiple.set(record.toolId, count + 1);
    });
    
    const multiCategoryTools = Array.from(toolsWithMultiple.values()).filter(count => count > 1).length;
    
    console.log(`Statistics:`);
    console.log(`- Total junction records: ${junctionRecords.length}`);
    console.log(`- Tools with multiple categories: ${multiCategoryTools}`);
    console.log(`- Average categories per tool: ${(junctionRecords.length / allTools.length).toFixed(2)}`);
    
    return {
      success: true,
      totalTools: allTools.length,
      junctionRecords: junctionRecords.length,
      multiCategoryTools
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      error: error
    };
  }
}