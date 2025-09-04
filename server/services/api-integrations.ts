import { db } from "../db";
import { tools, type Tool } from "@shared/schema";
import { eq } from "drizzle-orm";

// Interface for API integration configuration
interface ToolAPIConfig {
  name: string;
  apiUrl?: string;
  headers?: Record<string, string>;
  rateLimit?: number; // requests per minute
  dataMapper: (data: any) => Partial<ToolUpdate>;
  requiresAuth?: boolean;
}

interface ToolUpdate {
  pricing?: string;
  features?: string[];
  latestVersion?: string;
  description?: string;
  popularityScore?: number;
  communityScore?: number;
  lastUpdated?: Date;
}

// API configurations for various tools
const toolAPIConfigs: Record<string, ToolAPIConfig> = {
  "GitHub Copilot": {
    name: "GitHub Copilot",
    apiUrl: "https://api.github.com/repos/github/copilot-docs",
    headers: {
      "Accept": "application/vnd.github.v3+json"
    },
    rateLimit: 60,
    dataMapper: (data: any) => ({
      popularityScore: Math.min(10, (data.stargazers_count || 0) / 1000),
      communityScore: Math.min(10, (data.forks_count || 0) / 100),
      lastUpdated: new Date()
    })
  },
  "OpenAI API": {
    name: "OpenAI API",
    apiUrl: "https://api.openai.com/v1/models",
    requiresAuth: true,
    rateLimit: 30,
    dataMapper: (data: any) => ({
      features: data.data?.map((model: any) => model.id) || [],
      latestVersion: data.data?.[0]?.id || "gpt-4",
      lastUpdated: new Date()
    })
  },
  "Stripe": {
    name: "Stripe",
    apiUrl: "https://api.stripe.com/v1/products",
    requiresAuth: true,
    rateLimit: 100,
    dataMapper: (data: any) => ({
      features: ["Payment processing", "Subscriptions", "Invoicing", "Fraud detection"],
      pricing: "2.9% + 30¢ per successful charge",
      lastUpdated: new Date()
    })
  },
  "Next.js": {
    name: "Next.js",
    apiUrl: "https://api.github.com/repos/vercel/next.js/releases/latest",
    headers: {
      "Accept": "application/vnd.github.v3+json"
    },
    rateLimit: 60,
    dataMapper: (data: any) => ({
      latestVersion: data.tag_name?.replace('v', '') || "14.0.0",
      description: data.body?.substring(0, 500) || "The React Framework for Production",
      lastUpdated: new Date()
    })
  },
  "React": {
    name: "React",
    apiUrl: "https://api.github.com/repos/facebook/react/releases/latest",
    headers: {
      "Accept": "application/vnd.github.v3+json"
    },
    rateLimit: 60,
    dataMapper: (data: any) => ({
      latestVersion: data.tag_name?.replace('v', '') || "18.0.0",
      popularityScore: 10,
      communityScore: 10,
      lastUpdated: new Date()
    })
  },
  "Tailwind CSS": {
    name: "Tailwind CSS",
    apiUrl: "https://api.github.com/repos/tailwindlabs/tailwindcss/releases/latest",
    headers: {
      "Accept": "application/vnd.github.v3+json"
    },
    rateLimit: 60,
    dataMapper: (data: any) => ({
      latestVersion: data.tag_name?.replace('v', '') || "3.0.0",
      features: ["Utility-first CSS", "JIT compiler", "Dark mode", "Responsive design"],
      lastUpdated: new Date()
    })
  },
  "PostgreSQL": {
    name: "PostgreSQL",
    apiUrl: "https://www.postgresql.org/versions.json",
    rateLimit: 10,
    dataMapper: (data: any) => ({
      latestVersion: data.latest || "16.0",
      features: ["ACID compliance", "JSON support", "Full-text search", "Replication"],
      lastUpdated: new Date()
    })
  },
  "Vercel": {
    name: "Vercel",
    apiUrl: "https://api.vercel.com/v2/deployments",
    requiresAuth: true,
    headers: {
      "Authorization": "Bearer YOUR_VERCEL_TOKEN"
    },
    rateLimit: 100,
    dataMapper: (data: any) => ({
      features: ["Edge Functions", "Serverless", "Analytics", "Preview deployments"],
      pricing: "Free tier + $20/month Pro",
      lastUpdated: new Date()
    })
  }
};

// Rate limiting tracker
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

// Check rate limit
function checkRateLimit(toolName: string, limit: number): boolean {
  const now = Date.now();
  const tracker = rateLimitTracker.get(toolName);
  
  if (!tracker || now > tracker.resetTime) {
    rateLimitTracker.set(toolName, {
      count: 1,
      resetTime: now + 60000 // Reset after 1 minute
    });
    return true;
  }
  
  if (tracker.count >= limit) {
    return false;
  }
  
  tracker.count++;
  return true;
}

// Fetch data from external API
export async function fetchToolData(toolName: string, apiKey?: string): Promise<ToolUpdate | null> {
  const config = toolAPIConfigs[toolName];
  
  if (!config) {
    console.log(`No API configuration found for ${toolName}`);
    return null;
  }
  
  if (!config.apiUrl) {
    console.log(`No API URL configured for ${toolName}`);
    return null;
  }
  
  if (config.requiresAuth && !apiKey) {
    console.log(`API key required for ${toolName}`);
    return null;
  }
  
  // Check rate limit
  if (!checkRateLimit(toolName, config.rateLimit || 60)) {
    console.log(`Rate limit exceeded for ${toolName}`);
    return null;
  }
  
  try {
    const headers: HeadersInit = {
      ...config.headers,
      "User-Agent": "TechStack-Explorer/1.0"
    };
    
    if (config.requiresAuth && apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(config.apiUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch data for ${toolName}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return config.dataMapper(data);
  } catch (error) {
    console.error(`Error fetching data for ${toolName}:`, error);
    return null;
  }
}

// Update tool in database with fetched data
export async function updateToolWithAPIData(toolId: string, update: ToolUpdate): Promise<boolean> {
  try {
    const updateData: any = {};
    
    if (update.pricing) updateData.pricing = update.pricing;
    if (update.features) updateData.features = update.features;
    if (update.latestVersion) updateData.frameworks = [update.latestVersion];
    if (update.description) updateData.description = update.description;
    if (update.popularityScore !== undefined) updateData.popularityScore = update.popularityScore;
    if (update.communityScore !== undefined) updateData.communityScore = update.communityScore;
    
    // Add metadata about the update
    updateData.apiLastSync = new Date();
    
    await db.update(tools)
      .set(updateData)
      .where(eq(tools.id, toolId));
    
    return true;
  } catch (error) {
    console.error(`Error updating tool ${toolId}:`, error);
    return false;
  }
}

// Batch update multiple tools
export async function batchUpdateTools(toolNames?: string[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // Get tools from database
  const dbTools = await db.select().from(tools);
  const toolsToUpdate = toolNames 
    ? dbTools.filter((t: Tool) => toolNames.includes(t.name))
    : dbTools.filter((t: Tool) => toolAPIConfigs[t.name]); // Only update tools with API configs
  
  for (const tool of toolsToUpdate) {
    try {
      const update = await fetchToolData(tool.name);
      if (update) {
        const success = await updateToolWithAPIData(tool.id, update);
        if (success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to update ${tool.name} in database`);
        }
      } else {
        results.failed++;
        results.errors.push(`Failed to fetch data for ${tool.name}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error processing ${tool.name}: ${error}`);
    }
  }
  
  return results;
}

// Get available integrations
export function getAvailableIntegrations(): string[] {
  return Object.keys(toolAPIConfigs);
}

// Get integration status for a tool
export async function getIntegrationStatus(toolName: string): Promise<{
  available: boolean;
  requiresAuth: boolean;
  lastSync?: Date;
  rateLimit?: number;
}> {
  const config = toolAPIConfigs[toolName];
  
  if (!config) {
    return { available: false, requiresAuth: false };
  }
  
  // Get last sync time from database
  const [tool] = await db.select()
    .from(tools)
    .where(eq(tools.name, toolName));
  
  return {
    available: true,
    requiresAuth: config.requiresAuth || false,
    lastSync: tool?.apiLastSync || undefined,
    rateLimit: config.rateLimit
  };
}