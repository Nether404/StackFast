import { db } from "../db";
import { tools, toolCategories, toolCategoryJunction } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { parse } from 'csv-parse/sync';

interface CSVTool {
  Name: string;
  Categories: string;
  Description: string;
  URL: string;
  Frameworks: string;
  Features: string;
  "Native Integrations": string;
  "Verified Integrations": string;
  "Notable Strengths": string;
  "Known Limitations": string;
  "Maturity Score": string;
  "Popularity Score": string;
  Pricing: string;
}

// New category structure with parent-child relationships
const categoryStructure = [
  {
    name: "Development Environments",
    description: "IDEs, code editors, and development platforms",
    color: "#8B5CF6",
    subcategories: [
      { name: "IDE", description: "Integrated Development Environments" },
      { name: "Code Editor", description: "Lightweight code editors and extensions" }
    ]
  },
  {
    name: "AI Coding Assistants",
    description: "AI-powered coding tools and assistants",
    color: "#FF4500",
    subcategories: [
      { name: "Chat-based AI", description: "Conversational AI for coding" },
      { name: "IDE-integrated AI", description: "AI integrated into development environments" },
      { name: "Autonomous Agents", description: "Self-directed AI coding agents" }
    ]
  },
  {
    name: "No-Code/Low-Code",
    description: "Visual development and natural language coding platforms",
    color: "#10B981",
    subcategories: [
      { name: "Vibe Coding", description: "Natural language to code platforms" },
      { name: "Visual Builder", description: "Drag-and-drop app builders" }
    ]
  },
  {
    name: "Backend & Infrastructure",
    description: "Backend services, databases, and hosting platforms",
    color: "#238636",
    subcategories: [
      { name: "Database", description: "Database platforms and management tools" },
      { name: "Hosting", description: "Deployment and hosting services" },
      { name: "Backend Platform", description: "Complete backend solutions" }
    ]
  },
  {
    name: "Frontend & Design",
    description: "UI/UX tools, frontend frameworks, and design platforms",
    color: "#1F6FEB",
    subcategories: [
      { name: "UI Generation", description: "AI-powered UI component generators" },
      { name: "Design Tool", description: "Visual design and prototyping tools" }
    ]
  },
  {
    name: "Specialized Tools",
    description: "Tools for specific development tasks",
    color: "#9333EA",
    subcategories: [
      { name: "Database Tool", description: "SQL and database-specific tools" },
      { name: "Testing & QA", description: "Testing and quality assurance tools" },
      { name: "Framework", description: "Development frameworks and libraries" }
    ]
  },
  {
    name: "Payment & Commerce",
    description: "Payment processing and e-commerce tools",
    color: "#F59E0B",
    subcategories: []
  }
];

// Map CSV categories to new structure
const categoryMapping: Record<string, string[]> = {
  // IDEs
  "IDE": ["Development Environments/IDE"],
  
  // Coding tools and AI assistants
  "Coding tool": ["AI Coding Assistants/Chat-based AI"],
  "Agentic framework": ["AI Coding Assistants/Autonomous Agents", "Specialized Tools/Framework"],
  
  // No-code/Low-code
  "Vibe coding": ["No-Code/Low-Code/Vibe Coding"],
  
  // Design and Frontend
  "Design/frontend": ["Frontend & Design/UI Generation"],
  
  // Backend and Database
  "Database/backend": ["Backend & Infrastructure/Database", "Backend & Infrastructure/Backend Platform"],
  
  // Payment
  "Payment platform": ["Payment & Commerce"]
};

// Tool-specific overrides based on analysis
const toolOverrides: Record<string, string[]> = {
  "Cursor": ["Development Environments/IDE", "AI Coding Assistants/IDE-integrated AI"],
  "Windsurf": ["Development Environments/IDE", "AI Coding Assistants/IDE-integrated AI"],
  "Kiro AI": ["Development Environments/IDE", "AI Coding Assistants/IDE-integrated AI"],
  "Zed": ["Development Environments/IDE"],
  "GitHub Copilot": ["AI Coding Assistants/IDE-integrated AI", "Development Environments/Code Editor"],
  "Cody": ["AI Coding Assistants/IDE-integrated AI"],
  "Claude/Claude Code": ["AI Coding Assistants/Chat-based AI", "AI Coding Assistants/IDE-integrated AI"],
  "ChatGPT": ["AI Coding Assistants/Chat-based AI"],
  "Gemini (CLI)": ["AI Coding Assistants/Chat-based AI"],
  "Devin": ["AI Coding Assistants/Autonomous Agents"],
  "Lovable": ["No-Code/Low-Code/Vibe Coding", "Frontend & Design/UI Generation"],
  "Bolt": ["No-Code/Low-Code/Vibe Coding", "Frontend & Design/UI Generation"],
  "v0": ["Frontend & Design/UI Generation", "No-Code/Low-Code/Vibe Coding"],
  "Bubble": ["No-Code/Low-Code/Visual Builder"],
  "Knack": ["No-Code/Low-Code/Visual Builder"],
  "UI Bakery": ["No-Code/Low-Code/Visual Builder"],
  "Supabase": ["Backend & Infrastructure/Database", "Backend & Infrastructure/Backend Platform"],
  "Firebase": ["Backend & Infrastructure/Database", "Backend & Infrastructure/Backend Platform"],
  "Pocketbase": ["Backend & Infrastructure/Database"],
  "Vercel": ["Backend & Infrastructure/Hosting", "Frontend & Design/UI Generation"],
  "Netlify": ["Backend & Infrastructure/Hosting"],
  "Render": ["Backend & Infrastructure/Hosting"],
  "Replit": ["Development Environments/IDE", "No-Code/Low-Code/Vibe Coding", "Backend & Infrastructure/Hosting"],
  "Figma": ["Frontend & Design/Design Tool"],
  "Balsamiq": ["Frontend & Design/Design Tool"],
  "AI2sql": ["Specialized Tools/Database Tool"],
  "GibsonAI": ["Specialized Tools/Database Tool", "Backend & Infrastructure/Database"],
  "gocodeo": ["Specialized Tools/Testing & QA"],
  "LangChain": ["Specialized Tools/Framework", "AI Coding Assistants/Autonomous Agents"],
  "CrewAI": ["Specialized Tools/Framework", "AI Coding Assistants/Autonomous Agents"],
  "AutoGen": ["Specialized Tools/Framework", "AI Coding Assistants/Autonomous Agents"],
  "Tabnine": ["AI Coding Assistants/IDE-integrated AI"],
  "Codeium": ["AI Coding Assistants/IDE-integrated AI"],
  "Amazon CodeWhisperer": ["AI Coding Assistants/IDE-integrated AI"]
};

async function recategorizeTools() {
  console.log("Starting recategorization process...");
  
  try {
    // Step 1: Clear existing junctions first
    console.log("Clearing existing junctions...");
    await db.delete(toolCategoryJunction);
    
    // Step 2: Create a temporary category for all tools to avoid FK constraint issues
    console.log("Creating temporary category...");
    const [tempCategory] = await db.insert(toolCategories).values({
      name: "_TEMP_MIGRATION_CATEGORY",
      description: "Temporary category for migration",
      color: "#000000"
    }).returning();
    
    // Update all tools to use the temporary category
    console.log("Updating tools to use temporary category...");
    await db.update(tools).set({ categoryId: tempCategory.id });
    
    // Step 3: Delete old categories (except the temporary one)
    console.log("Deleting old categories...");
    await db.delete(toolCategories).where(
      sql`${toolCategories.id} != ${tempCategory.id}`
    );
    
    // Step 2: Create new categories
    console.log("Creating new category structure...");
    const categoryMap = new Map<string, string>();
    
    for (const parent of categoryStructure) {
      // Create parent category
      const [parentCategory] = await db.insert(toolCategories).values({
        name: parent.name,
        description: parent.description,
        color: parent.color
      }).returning();
      
      categoryMap.set(parent.name, parentCategory.id);
      console.log(`Created parent category: ${parent.name}`);
      
      // Create subcategories
      for (const sub of parent.subcategories) {
        const [subCategory] = await db.insert(toolCategories).values({
          name: `${parent.name}/${sub.name}`,
          description: sub.description,
          color: parent.color
        }).returning();
        
        categoryMap.set(`${parent.name}/${sub.name}`, subCategory.id);
        console.log(`  Created subcategory: ${sub.name}`);
      }
    }
    
    // Step 3: Read CSV and update tools
    console.log("\nReading CSV file...");
    const csvPath = path.join(process.cwd(), "attached_assets", "Coding tool profile database setup_1754841204572.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records: CSVTool[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} tools in CSV`);
    
    // Step 4: Process each tool
    for (const record of records) {
      const toolName = record.Name.trim();
      console.log(`\nProcessing: ${toolName}`);
      
      // Find or create tool
      let [tool] = await db.select().from(tools).where(eq(tools.name, toolName));
      
      if (!tool) {
        console.log(`  Tool not found in database, skipping: ${toolName}`);
        continue;
      }
      
      // Determine categories for this tool
      let toolCategories: string[] = [];
      
      // Check for manual overrides first
      if (toolOverrides[toolName]) {
        toolCategories = toolOverrides[toolName];
        console.log(`  Using override categories: ${toolCategories.join(", ")}`);
      } else {
        // Parse categories from CSV
        const csvCategories = record.Categories.split(",").map(c => c.trim());
        for (const csvCat of csvCategories) {
          if (categoryMapping[csvCat]) {
            toolCategories.push(...categoryMapping[csvCat]);
          }
        }
        console.log(`  Mapped categories: ${toolCategories.join(", ")}`);
      }
      
      // Remove duplicates
      toolCategories = Array.from(new Set(toolCategories));
      
      // Create junction entries
      for (const catPath of toolCategories) {
        const categoryId = categoryMap.get(catPath);
        if (categoryId) {
          await db.insert(toolCategoryJunction).values({
            toolId: tool.id,
            categoryId: categoryId
          }).onConflictDoNothing();
          console.log(`    Added to category: ${catPath}`);
        }
      }
    }
    
    console.log("\n✅ Recategorization complete!");
    
    // Step 5: Show statistics
    const stats = await db.execute(`
      SELECT c.name, COUNT(DISTINCT j.tool_id) as tool_count
      FROM tool_categories c
      LEFT JOIN tool_category_junction j ON c.id = j.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    console.log("\nCategory Statistics:");
    stats.rows.forEach((row: any) => {
      console.log(`  ${row.name}: ${row.tool_count} tools`);
    });
    
  } catch (error) {
    console.error("Error during recategorization:", error);
    throw error;
  }
}

// Run the recategorization
recategorizeTools()
  .then(() => {
    console.log("Process completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Process failed:", error);
    process.exit(1);
  });