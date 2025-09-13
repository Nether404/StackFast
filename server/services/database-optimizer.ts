import { db } from "../db";
import { 
  tools as toolsTable, 
  compatibilities as compatibilitiesTable,
  toolCategories as toolCategoriesTable,
  toolCategoryJunction
} from "@shared/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import type { Tool, Compatibility, InsertTool, InsertCompatibility } from "@shared/schema";

export class DatabaseOptimizer {
  /**
   * Apply database indexes for performance optimization
   */
  static async applyIndexes(): Promise<void> {
    const indexQueries = [
      // Index on tools.name for name-based searches
      `CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name)`,
      
      // Index on tools.category_id for category-based filtering
      `CREATE INDEX IF NOT EXISTS idx_tools_category_id ON tools(category_id)`,
      
      // Index on compatibilities.tool_one_id for compatibility lookups
      `CREATE INDEX IF NOT EXISTS idx_compatibilities_tool_one_id ON compatibilities(tool_one_id)`,
      
      // Index on compatibilities.tool_two_id for compatibility lookups
      `CREATE INDEX IF NOT EXISTS idx_compatibilities_tool_two_id ON compatibilities(tool_two_id)`,
      
      // Composite index for compatibility pair lookups (most common query pattern)
      `CREATE INDEX IF NOT EXISTS idx_compatibilities_tool_pair ON compatibilities(tool_one_id, tool_two_id)`,
      
      // Index on tools.maturity_score for sorting and filtering by quality
      `CREATE INDEX IF NOT EXISTS idx_tools_maturity_score ON tools(maturity_score)`,
      
      // Index on tools.popularity_score for sorting and filtering by popularity
      `CREATE INDEX IF NOT EXISTS idx_tools_popularity_score ON tools(popularity_score)`,
      
      // Index on tool_category_junction for many-to-many relationships
      `CREATE INDEX IF NOT EXISTS idx_tool_category_junction_tool_id ON tool_category_junction(tool_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tool_category_junction_category_id ON tool_category_junction(category_id)`,
      
      // Composite index for primary category lookups
      `CREATE INDEX IF NOT EXISTS idx_tool_category_junction_primary ON tool_category_junction(tool_id, is_primary) WHERE is_primary = true`
    ];

    for (const query of indexQueries) {
      try {
        await db.execute(sql.raw(query));
      } catch (error) {
        console.error(`Failed to create index: ${query}`, error);
      }
    }
  }

  /**
   * Batch insert tools with optimized performance
   */
  static async batchInsertTools(tools: InsertTool[]): Promise<Tool[]> {
    if (tools.length === 0) return [];
    
    // Use batch insert for better performance
    const batchSize = 100;
    const results: Tool[] = [];
    
    for (let i = 0; i < tools.length; i += batchSize) {
      const batch = tools.slice(i, i + batchSize);
      const batchResults = await db.insert(toolsTable).values(batch).returning();
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Batch insert compatibilities with optimized performance
   */
  static async batchInsertCompatibilities(compatibilities: InsertCompatibility[]): Promise<Compatibility[]> {
    if (compatibilities.length === 0) return [];
    
    // Use batch insert for better performance
    const batchSize = 100;
    const results: Compatibility[] = [];
    
    for (let i = 0; i < compatibilities.length; i += batchSize) {
      const batch = compatibilities.slice(i, i + batchSize);
      const batchResults = await db.insert(compatibilitiesTable).values(batch).returning();
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Batch update tools with optimized performance
   */
  static async batchUpdateTools(updates: Array<{ id: string; data: Partial<InsertTool> }>): Promise<Tool[]> {
    if (updates.length === 0) return [];
    
    const results: Tool[] = [];
    
    // Process updates in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // Execute updates in parallel within each batch
      const batchPromises = batch.map(({ id, data }) =>
        db.update(toolsTable).set(data).where(eq(toolsTable.id, id)).returning()
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
    }
    
    return results;
  }

  /**
   * Optimized query to get tools with categories using efficient joins
   */
  static async getToolsWithCategoriesOptimized(): Promise<any[]> {
    // Use a single optimized query with proper joins
    const result = await db.select({
      id: toolsTable.id,
      name: toolsTable.name,
      description: toolsTable.description,
      categoryId: toolsTable.categoryId,
      url: toolsTable.url,
      frameworks: toolsTable.frameworks,
      languages: toolsTable.languages,
      features: toolsTable.features,
      integrations: toolsTable.integrations,
      maturityScore: toolsTable.maturityScore,
      popularityScore: toolsTable.popularityScore,
      pricing: toolsTable.pricing,
      notes: toolsTable.notes,
      setupComplexity: toolsTable.setupComplexity,
      costTier: toolsTable.costTier,
      performanceImpact: toolsTable.performanceImpact,
      apiLastSync: toolsTable.apiLastSync,
      category: {
        id: toolCategoriesTable.id,
        name: toolCategoriesTable.name,
        description: toolCategoriesTable.description,
        color: toolCategoriesTable.color
      }
    })
    .from(toolsTable)
    .leftJoin(toolCategoriesTable, eq(toolsTable.categoryId, toolCategoriesTable.id));

    return result;
  }

  /**
   * Optimized compatibility matrix query with efficient joins
   */
  static async getCompatibilityMatrixOptimized(): Promise<any[]> {
    // Use a single optimized query with proper joins to avoid N+1 queries
    const result = await db.select({
      compatibility: compatibilitiesTable,
      toolOne: {
        id: sql`tool_one.id`.as('tool_one_id'),
        name: sql`tool_one.name`.as('tool_one_name'),
        description: sql`tool_one.description`.as('tool_one_description'),
        categoryId: sql`tool_one.category_id`.as('tool_one_category_id'),
        url: sql`tool_one.url`.as('tool_one_url'),
        frameworks: sql`tool_one.frameworks`.as('tool_one_frameworks'),
        languages: sql`tool_one.languages`.as('tool_one_languages'),
        features: sql`tool_one.features`.as('tool_one_features'),
        integrations: sql`tool_one.integrations`.as('tool_one_integrations'),
        maturityScore: sql`tool_one.maturity_score`.as('tool_one_maturity_score'),
        popularityScore: sql`tool_one.popularity_score`.as('tool_one_popularity_score'),
        pricing: sql`tool_one.pricing`.as('tool_one_pricing'),
        notes: sql`tool_one.notes`.as('tool_one_notes'),
        setupComplexity: sql`tool_one.setup_complexity`.as('tool_one_setup_complexity'),
        costTier: sql`tool_one.cost_tier`.as('tool_one_cost_tier'),
        performanceImpact: sql`tool_one.performance_impact`.as('tool_one_performance_impact'),
        apiLastSync: sql`tool_one.api_last_sync`.as('tool_one_api_last_sync'),
        category: {
          id: sql`cat_one.id`.as('cat_one_id'),
          name: sql`cat_one.name`.as('cat_one_name'),
          description: sql`cat_one.description`.as('cat_one_description'),
          color: sql`cat_one.color`.as('cat_one_color')
        }
      },
      toolTwo: {
        id: sql`tool_two.id`.as('tool_two_id'),
        name: sql`tool_two.name`.as('tool_two_name'),
        description: sql`tool_two.description`.as('tool_two_description'),
        categoryId: sql`tool_two.category_id`.as('tool_two_category_id'),
        url: sql`tool_two.url`.as('tool_two_url'),
        frameworks: sql`tool_two.frameworks`.as('tool_two_frameworks'),
        languages: sql`tool_two.languages`.as('tool_two_languages'),
        features: sql`tool_two.features`.as('tool_two_features'),
        integrations: sql`tool_two.integrations`.as('tool_two_integrations'),
        maturityScore: sql`tool_two.maturity_score`.as('tool_two_maturity_score'),
        popularityScore: sql`tool_two.popularity_score`.as('tool_two_popularity_score'),
        pricing: sql`tool_two.pricing`.as('tool_two_pricing'),
        notes: sql`tool_two.notes`.as('tool_two_notes'),
        setupComplexity: sql`tool_two.setup_complexity`.as('tool_two_setup_complexity'),
        costTier: sql`tool_two.cost_tier`.as('tool_two_cost_tier'),
        performanceImpact: sql`tool_two.performance_impact`.as('tool_two_performance_impact'),
        apiLastSync: sql`tool_two.api_last_sync`.as('tool_two_api_last_sync'),
        category: {
          id: sql`cat_two.id`.as('cat_two_id'),
          name: sql`cat_two.name`.as('cat_two_name'),
          description: sql`cat_two.description`.as('cat_two_description'),
          color: sql`cat_two.color`.as('cat_two_color')
        }
      }
    })
    .from(compatibilitiesTable)
    .leftJoin(sql`tools as tool_one`, eq(compatibilitiesTable.toolOneId, sql`tool_one.id`))
    .leftJoin(sql`tools as tool_two`, eq(compatibilitiesTable.toolTwoId, sql`tool_two.id`))
    .leftJoin(sql`tool_categories as cat_one`, eq(sql`tool_one.category_id`, sql`cat_one.id`))
    .leftJoin(sql`tool_categories as cat_two`, eq(sql`tool_two.category_id`, sql`cat_two.id`));

    return result;
  }

  /**
   * Bulk compatibility check with optimized query
   */
  static async getBulkCompatibilityOptimized(toolIds: string[]): Promise<Array<{
    toolOneId: string;
    toolTwoId: string;
    score: number;
    notes?: string;
  }>> {
    if (toolIds.length < 2) return [];

    // Use a single query to get all compatibility pairs for the given tools
    const compatibilities = await db.select({
      toolOneId: compatibilitiesTable.toolOneId,
      toolTwoId: compatibilitiesTable.toolTwoId,
      score: compatibilitiesTable.compatibilityScore,
      notes: compatibilitiesTable.notes
    })
    .from(compatibilitiesTable)
    .where(
      and(
        inArray(compatibilitiesTable.toolOneId, toolIds),
        inArray(compatibilitiesTable.toolTwoId, toolIds)
      )
    );

    return compatibilities.map(c => ({
      toolOneId: c.toolOneId,
      toolTwoId: c.toolTwoId,
      score: c.score,
      notes: c.notes || undefined
    }));
  }

  /**
   * Optimized search with proper indexing
   */
  static async searchToolsOptimized(query: string, limit: number = 50): Promise<Tool[]> {
    // Use ILIKE for case-insensitive search with proper indexing
    const searchPattern = `%${query.toLowerCase()}%`;
    
    const results = await db.select()
      .from(toolsTable)
      .where(
        or(
          sql`LOWER(${toolsTable.name}) LIKE ${searchPattern}`,
          sql`LOWER(${toolsTable.description}) LIKE ${searchPattern}`
        )
      )
      .limit(limit);

    return results;
  }

  /**
   * Get tools by multiple IDs with optimized query
   */
  static async getToolsByIdsOptimized(toolIds: string[]): Promise<Tool[]> {
    if (toolIds.length === 0) return [];
    
    // Use inArray for efficient bulk lookup
    return await db.select()
      .from(toolsTable)
      .where(inArray(toolsTable.id, toolIds));
  }

  /**
   * Get compatibility relationships for a tool with optimized query
   */
  static async getCompatibilitiesByToolIdOptimized(toolId: string): Promise<Compatibility[]> {
    // Use indexed columns for efficient lookup
    return await db.select()
      .from(compatibilitiesTable)
      .where(
        or(
          eq(compatibilitiesTable.toolOneId, toolId),
          eq(compatibilitiesTable.toolTwoId, toolId)
        )
      );
  }

  /**
   * Batch delete with optimized performance
   */
  static async batchDeleteTools(toolIds: string[]): Promise<number> {
    if (toolIds.length === 0) return 0;
    
    // Delete in batches to avoid overwhelming the database
    const batchSize = 100;
    let totalDeleted = 0;
    
    for (let i = 0; i < toolIds.length; i += batchSize) {
      const batch = toolIds.slice(i, i + batchSize);
      const result = await db.delete(toolsTable).where(inArray(toolsTable.id, batch));
      totalDeleted += result.rowCount || 0;
    }
    
    return totalDeleted;
  }

  /**
   * Get database statistics for monitoring
   */
  static async getDatabaseStats(): Promise<{
    toolCount: number;
    categoryCount: number;
    compatibilityCount: number;
    indexInfo: any[];
  }> {
    const [toolCount] = await db.select({ count: sql`count(*)` }).from(toolsTable);
    const [categoryCount] = await db.select({ count: sql`count(*)` }).from(toolCategoriesTable);
    const [compatibilityCount] = await db.select({ count: sql`count(*)` }).from(compatibilitiesTable);
    
    // Get index information (PostgreSQL specific)
    const indexInfo = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    return {
      toolCount: Number(toolCount.count),
      categoryCount: Number(categoryCount.count),
      compatibilityCount: Number(compatibilityCount.count),
      indexInfo: indexInfo.rows || []
    };
  }
}