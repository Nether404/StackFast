import { storage } from '../storage';
import { InsertTool } from '@shared/schema';
import { randomUUID } from 'crypto';

// StackFast tools data extracted from their mock tools
const stackfastTools = [
  {
    tool_id: "replit",
    name: "Replit",
    description: "Browser-based IDE with instant hosting and AI-assisted coding.",
    category: ["Vibe Coding Tool", "Cloud IDE"],
    notable_strengths: ["Instant dev environment", "Ghostwriter AI"],
    known_limitations: ["Limited offline access", "Resource constraints"],
    output_types: ["code", "live_preview"],
    integrations: ["GitHub", "Vercel", "Netlify"],
    license: "Proprietary",
    maturity_score: 0.9,
  },
  {
    tool_id: "cursor",
    name: "Cursor IDE",
    description: "AI-first code editor built on VS Code with advanced AI capabilities.",
    category: ["Agentic Tool", "Code Editor"],
    notable_strengths: ["Advanced AI chat", "Codebase understanding"],
    known_limitations: ["Resource intensive", "Requires internet"],
    output_types: ["code", "explanations"],
    integrations: ["Git", "GitHub", "VS Code extensions"],
    license: "Proprietary",
    maturity_score: 0.8,
  },
  {
    tool_id: "bolt",
    name: "Bolt.new",
    description: "AI-powered web app builder with instant deployment.",
    category: ["Vibe Coding Tool", "No-Code Platform"],
    notable_strengths: ["Instant deployment", "AI generation"],
    known_limitations: ["Limited customization", "Vendor lock-in"],
    output_types: ["hosted_app", "code"],
    integrations: ["Vercel", "GitHub"],
    license: "Proprietary",
    maturity_score: 0.7,
  },
  {
    tool_id: "v0",
    name: "v0",
    description: "Vercel's AI-powered UI generation tool for React components.",
    category: ["Agentic Tool", "UI Builder"],
    notable_strengths: ["Component generation", "Tailwind CSS support"],
    known_limitations: ["React only", "Limited to components"],
    output_types: ["react_components", "code"],
    integrations: ["Vercel", "Next.js", "Tailwind CSS"],
    license: "Proprietary",
    maturity_score: 0.75,
  },
  {
    tool_id: "claude-artifacts",
    name: "Claude Artifacts",
    description: "Interactive code execution and visualization within Claude AI.",
    category: ["Agentic Tool", "AI Assistant"],
    notable_strengths: ["Real-time execution", "Multi-language support"],
    known_limitations: ["Session-based", "No persistence"],
    output_types: ["code", "visualizations", "interactive_demos"],
    integrations: ["Claude API"],
    license: "Proprietary",
    maturity_score: 0.85,
  },
  {
    tool_id: "windsurf-ide",
    name: "Windsurf IDE",
    description: "Next-generation IDE with AI-powered code flows and automation.",
    category: ["Agentic Tool", "Code Editor"],
    notable_strengths: ["Flow automation", "AI workflows"],
    known_limitations: ["Early stage", "Limited ecosystem"],
    output_types: ["code", "workflows"],
    integrations: ["Git", "GitHub"],
    license: "Proprietary",
    maturity_score: 0.65,
  }
];

export async function importStackFastTools(): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  // Get existing categories
  const categories = await storage.getToolCategories();
  
  // Category mapping from StackFast to our system
  const categoryMap = new Map<string, string>();
  categories.forEach(cat => {
    // Map StackFast categories to our categories
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

  // Get default category if mapping fails
  const defaultCategoryId = categories.find(c => c.name === "Development Environments")?.id || categories[0]?.id;

  for (const stackfastTool of stackfastTools) {
    try {
      // Check if tool already exists
      const existingTools = await storage.getToolsWithCategory();
      const exists = existingTools.some(t => 
        t.name.toLowerCase() === stackfastTool.name.toLowerCase() ||
        t.name.includes(stackfastTool.name.split(' ')[0])
      );

      if (exists) {
        console.log(`Tool ${stackfastTool.name} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Map to our tool schema
      const tool: InsertTool = {
        id: randomUUID(),
        name: stackfastTool.name,
        description: stackfastTool.description,
        categoryId: categoryMap.get(stackfastTool.category[0]) || defaultCategoryId,
        url: null, // Will be added later if available
        frameworks: [], // Extract from integrations if needed
        languages: [], // Determine based on tool type
        features: stackfastTool.notable_strengths,
        integrations: stackfastTool.integrations,
        maturityScore: stackfastTool.maturity_score * 10, // Convert to 0-10 scale
        popularityScore: stackfastTool.maturity_score * 10 * 0.9, // Estimate based on maturity
        pricing: determinePricing(stackfastTool.name),
        notes: `Imported from StackFast. Limitations: ${stackfastTool.known_limitations.join(', ')}. Output types: ${stackfastTool.output_types.join(', ')}`
      };

      // Add languages based on tool type
      if (stackfastTool.name.includes('IDE') || stackfastTool.name === 'Replit' || stackfastTool.name === 'Cursor IDE') {
        tool.languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go'];
      } else if (stackfastTool.name === 'v0') {
        tool.languages = ['JavaScript', 'TypeScript'];
        tool.frameworks = ['React', 'Next.js', 'Tailwind CSS'];
      } else if (stackfastTool.name.includes('Claude')) {
        tool.languages = ['JavaScript', 'Python', 'TypeScript', 'Java', 'C++'];
      }

      await storage.createTool(tool);
      imported++;
      console.log(`Imported tool: ${stackfastTool.name}`);

      // Add to additional categories if specified
      if (stackfastTool.category.length > 1) {
        for (let i = 1; i < stackfastTool.category.length; i++) {
          const additionalCategoryId = categoryMap.get(stackfastTool.category[i]);
          if (additionalCategoryId && additionalCategoryId !== tool.categoryId) {
            await storage.addToolToCategory(tool.id, additionalCategoryId);
          }
        }
      }

    } catch (error) {
      console.error(`Error importing tool ${stackfastTool.name}:`, error);
      skipped++;
    }
  }

  return { imported, skipped };
}

function determinePricing(toolName: string): string {
  const pricingMap: Record<string, string> = {
    'Replit': 'Free tier available, Pro from $20/month',
    'Cursor IDE': 'Free tier available, Pro from $20/month',
    'Bolt.new': 'Free tier with limits, Pro from $15/month',
    'v0': 'Credits-based, starts at $10/month',
    'Claude Artifacts': 'Part of Claude Pro at $20/month',
    'Windsurf IDE': 'Free during beta, pricing TBD'
  };
  
  return pricingMap[toolName] || 'Pricing information available on website';
}