import { db } from "../db";
import { tools, toolCategories, toolCategoryJunction } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function assignDefaultCategories() {
  console.log("Assigning default categories to tools...");
  
  try {
    // Get all tools with their categories from the junction table
    const toolsWithCategories = await db.execute(`
      SELECT 
        t.id as tool_id,
        t.name as tool_name,
        ARRAY_AGG(j.category_id) as category_ids
      FROM tools t
      LEFT JOIN tool_category_junction j ON t.id = j.tool_id
      GROUP BY t.id, t.name
    `);
    
    console.log(`Found ${toolsWithCategories.rows.length} tools to update`);
    
    // For each tool, set its categoryId to the first category from junction
    for (const row of toolsWithCategories.rows) {
      const toolId = row.tool_id as string;
      const toolName = row.tool_name as string;
      const categoryIds = row.category_ids as string[] | null;
      
      if (categoryIds && categoryIds.length > 0 && categoryIds[0]) {
        // Use the first category as the default
        await db.update(tools)
          .set({ categoryId: categoryIds[0] })
          .where(eq(tools.id, toolId));
        console.log(`  Updated ${toolName} with default category`);
      } else {
        // If no categories in junction, assign to "AI Coding Assistants/Chat-based AI" as default
        const [defaultCategory] = await db.select()
          .from(toolCategories)
          .where(eq(toolCategories.name, "AI Coding Assistants/Chat-based AI"))
          .limit(1);
        
        if (defaultCategory) {
          await db.update(tools)
            .set({ categoryId: defaultCategory.id })
            .where(eq(tools.id, toolId));
          console.log(`  Updated ${toolName} with fallback category`);
        }
      }
    }
    
    // Delete the temporary migration category
    console.log("\nDeleting temporary migration category...");
    await db.delete(toolCategories)
      .where(eq(toolCategories.name, "_TEMP_MIGRATION_CATEGORY"));
    
    console.log("✅ Default categories assigned successfully!");
    
    // Show final statistics
    const stats = await db.execute(`
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT t.id) as tool_count
      FROM tool_categories c
      LEFT JOIN tools t ON t.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    console.log("\nFinal Category Statistics (default categories):");
    stats.rows.forEach((row: any) => {
      if (row.tool_count > 0) {
        console.log(`  ${row.category_name}: ${row.tool_count} tools`);
      }
    });
    
  } catch (error) {
    console.error("Error assigning default categories:", error);
    throw error;
  }
}

// Run the assignment
assignDefaultCategories()
  .then(() => {
    console.log("Process completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Process failed:", error);
    process.exit(1);
  });