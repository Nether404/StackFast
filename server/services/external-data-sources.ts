import { db } from "../db";
import { tools, toolCategories, type Tool, type ToolCategory } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

// Configuration for external data sources
interface DataSourceConfig {
  name: string;
  type: 'rest' | 'graphql' | 'registry';
  baseUrl: string;
  requiresAuth: boolean;
  rateLimit?: number; // requests per minute
  dataMapping: {
    name: string;
    description?: string;
    category?: string;
    url?: string;
    features?: string | string[];
    pricing?: string;
  };
}

// External data source configurations
const dataSources: Record<string, DataSourceConfig> = {
  back4app: {
    name: 'Back4App Developer Tools Database',
    type: 'rest',
    baseUrl: 'https://parseapi.back4app.com',
    requiresAuth: true,
    rateLimit: 60,
    dataMapping: {
      name: 'Name',
      description: 'Description',
      category: 'Category',
      url: 'Website',
      features: 'Details',
      pricing: 'ServiceOffering'
    }
  },
  github: {
    name: 'GitHub API',
    type: 'rest',
    baseUrl: 'https://api.github.com',
    requiresAuth: false,
    rateLimit: 60,
    dataMapping: {
      name: 'name',
      description: 'description',
      url: 'html_url',
      features: ['topics'],
      pricing: 'free'
    }
  },
  npm: {
    name: 'npm Registry',
    type: 'rest',
    baseUrl: 'https://registry.npmjs.org',
    requiresAuth: false,
    rateLimit: 100,
    dataMapping: {
      name: 'name',
      description: 'description',
      url: 'homepage',
      features: ['keywords'],
      pricing: 'free'
    }
  },
  producthunt: {
    name: 'Product Hunt API',
    type: 'graphql',
    baseUrl: 'https://api.producthunt.com/v2/api/graphql',
    requiresAuth: true,
    rateLimit: 30,
    dataMapping: {
      name: 'name',
      description: 'tagline',
      category: 'topics',
      url: 'website',
      features: ['description'],
      pricing: 'pricing_type'
    }
  },
  devhunt: {
    name: 'DevHunt API',
    type: 'rest',
    baseUrl: 'https://devhunt.org/api',
    requiresAuth: false,
    rateLimit: 60,
    dataMapping: {
      name: 'name',
      description: 'description',
      category: 'category',
      url: 'url',
      features: ['tags'],
      pricing: 'pricing'
    }
  }
};

// Fetch data from Back4App database
async function fetchBack4AppTools(apiKey?: string): Promise<any[]> {
  try {
    const headers: Record<string, string> = {
      'X-Parse-Application-Id': process.env.BACK4APP_APP_ID || 'X4zHblrpTF5ZhOwoKXzm6PhPpUQCQLrmZoKPBAoS',
      'X-Parse-REST-API-Key': apiKey || process.env.BACK4APP_API_KEY || ''
    };

    // Fetch categories first
    const categoriesResponse = await fetch(
      `${dataSources.back4app.baseUrl}/classes/Categories`,
      { headers }
    );
    
    if (!categoriesResponse.ok) {
      console.error('Failed to fetch Back4App categories');
      return [];
    }

    const categoriesData = await categoriesResponse.json();
    
    // Fetch vendors/tools
    const vendorsResponse = await fetch(
      `${dataSources.back4app.baseUrl}/classes/Vendors_List?limit=500`,
      { headers }
    );
    
    if (!vendorsResponse.ok) {
      console.error('Failed to fetch Back4App vendors');
      return [];
    }

    const vendorsData = await vendorsResponse.json();
    return vendorsData.results || [];
  } catch (error) {
    console.error('Error fetching Back4App data:', error);
    return [];
  }
}

// Fetch GitHub trending repositories with more diverse queries
async function fetchGitHubTrending(language?: string, page: number = 1): Promise<any[]> {
  try {
    // Use a variety of queries to get diverse repositories
    const queries = [
      'stars:>5000 pushed:>2024-01-01',
      'language:JavaScript stars:>1000',
      'language:Python stars:>1000',
      'language:TypeScript stars:>1000',
      'language:Go stars:>500',
      'language:Rust stars:>500',
      'topic:ai stars:>500',
      'topic:machine-learning stars:>500',
      'topic:web stars:>1000',
      'topic:framework stars:>500',
      'topic:database stars:>500',
      'topic:api stars:>500',
      'topic:devops stars:>500',
      'topic:testing stars:>500',
      'topic:security stars:>500'
    ];
    
    // If language is specified, use it; otherwise rotate through queries
    let query: string;
    if (language) {
      query = `language:${language} stars:>1000 pushed:>2024-01-01`;
    } else {
      // Use different query based on page to get variety
      const queryIndex = (page - 1) % queries.length;
      query = queries[queryIndex];
    }
    
    const response = await fetch(
      `${dataSources.github.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch GitHub data');
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return [];
  }
}

// Fetch npm packages by keyword
async function fetchNpmPackages(keyword: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=keywords:${keyword}&size=100`
    );

    if (!response.ok) {
      console.error('Failed to fetch npm data');
      return [];
    }

    const data = await response.json();
    return data.objects?.map((obj: any) => obj.package) || [];
  } catch (error) {
    console.error('Error fetching npm data:', error);
    return [];
  }
}

// Fetch Product Hunt tools
async function fetchProductHuntTools(apiKey?: string): Promise<any[]> {
  if (!apiKey && !process.env.PRODUCTHUNT_TOKEN) {
    console.log('Product Hunt API key not available');
    return [];
  }

  try {
    const query = `
      query {
        posts(first: 100, topic: "developer-tools", order: VOTES) {
          edges {
            node {
              name
              tagline
              description
              website
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(dataSources.producthunt.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey || process.env.PRODUCTHUNT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error('Failed to fetch Product Hunt data');
      return [];
    }

    const data = await response.json();
    return data.data?.posts?.edges?.map((edge: any) => edge.node) || [];
  } catch (error) {
    console.error('Error fetching Product Hunt data:', error);
    return [];
  }
}

// Transform external data to our schema format
function transformToToolFormat(data: any, source: string): Partial<Tool> {
  const mapping = dataSources[source]?.dataMapping;
  if (!mapping) return {};

  const tool: Partial<Tool> = {
    name: data[mapping.name] || 'Unknown',
    description: data[mapping.description || ''] || '',
    url: data[mapping.url || ''] || '',
    pricing: data[mapping.pricing || ''] || 'unknown'
  };

  // Handle features array
  if (mapping.features) {
    if (Array.isArray(mapping.features)) {
      tool.features = mapping.features.flatMap(field => data[field] || []);
    } else {
      tool.features = data[mapping.features] || [];
    }
  }

  // Add source-specific transformations
  if (source === 'github') {
    tool.popularityScore = Math.min(10, (data.stargazers_count || 0) / 10000) as number;
    tool.maturityScore = Math.min(10, (data.forks_count || 0) / 1000) as number;
    tool.features = [...(tool.features || []), `${data.stargazers_count} stars`, `${data.language}`];
  }

  if (source === 'npm') {
    tool.popularityScore = Math.min(10, (data.downloads?.weekly || 0) / 100000) as number;
    tool.maturityScore = data.version ? (parseFloat(data.version.split('.')[0]) > 1 ? 8 : 5) : 5;
  }

  return tool;
}

// Main function to sync external data sources
export async function syncExternalDataSources(
  sources: string[] = ['github', 'npm'],
  options: {
    apiKeys?: Record<string, string>;
    updateExisting?: boolean;
    dryRun?: boolean;
    page?: number;
  } = {}
): Promise<{
  imported: number;
  updated: number;
  failed: number;
  skipped: number;
  sources: Record<string, number>;
}> {
  const results = {
    imported: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    sources: {} as Record<string, number>
  };

  // Ensure we have categories
  const categories = await db.select().from(toolCategories);
  let devToolsCategory = categories.find(c => c.name === 'Developer Tools');
  
  if (!devToolsCategory) {
    [devToolsCategory] = await db.insert(toolCategories).values({
      name: 'Developer Tools',
      description: 'Tools imported from external sources',
      color: '#4A90E2'
    }).returning();
  }

  for (const source of sources) {
    results.sources[source] = 0;
    
    try {
      let externalData: any[] = [];
      
      // Fetch data based on source
      switch (source) {
        case 'back4app':
          externalData = await fetchBack4AppTools(options.apiKeys?.back4app);
          break;
        case 'github':
          // Use page parameter or random page for variety
          const githubPage = options.page || Math.floor(Math.random() * 5) + 1;
          externalData = await fetchGitHubTrending(undefined, githubPage);
          break;
        case 'npm':
          // Fetch popular categories
          const keywords = ['framework', 'database', 'api', 'testing', 'build-tool'];
          for (const keyword of keywords) {
            const packages = await fetchNpmPackages(keyword);
            externalData.push(...packages);
          }
          break;
        case 'producthunt':
          externalData = await fetchProductHuntTools(options.apiKeys?.producthunt);
          break;
      }

      // Process each item
      for (const item of externalData) {
        try {
          const toolData = transformToToolFormat(item, source);
          
          if (!toolData.name) continue;

          // Check if tool already exists
          const existingTools = await db
            .select()
            .from(tools)
            .where(eq(tools.name, toolData.name));

          if (existingTools.length > 0) {
            if (options.updateExisting && !options.dryRun) {
              // Update existing tool
              await db
                .update(tools)
                .set({
                  ...toolData,
                  apiLastSync: new Date()
                })
                .where(eq(tools.id, existingTools[0].id));
              results.updated++;
            } else {
              // Tool exists but we're not updating it
              results.skipped++;
            }
          } else if (!options.dryRun) {
            // Insert new tool
            await db.insert(tools).values({
              ...toolData,
              categoryId: devToolsCategory!.id,
              maturityScore: toolData.maturityScore || 5,
              popularityScore: toolData.popularityScore || 5,
              apiLastSync: new Date()
            } as any);
            results.imported++;
            results.sources[source]++;
          }
        } catch (error) {
          console.error(`Error processing item from ${source}:`, error);
          results.failed++;
        }
      }
    } catch (error) {
      console.error(`Error fetching data from ${source}:`, error);
    }
  }

  return results;
}

// Get available external data sources
export function getAvailableDataSources(): {
  id: string;
  name: string;
  requiresAuth: boolean;
  type: string;
  description: string;
}[] {
  return Object.entries(dataSources).map(([id, config]) => ({
    id,
    name: config.name,
    requiresAuth: config.requiresAuth,
    type: config.type,
    description: getSourceDescription(id)
  }));
}

function getSourceDescription(source: string): string {
  const descriptions: Record<string, string> = {
    back4app: '500+ developer tools across 50 categories from Back4App database',
    github: 'Trending repositories and developer tools from GitHub',
    npm: 'Popular npm packages and JavaScript libraries',
    producthunt: 'Latest developer tools launched on Product Hunt',
    devhunt: 'Developer-focused tools from DevHunt platform'
  };
  return descriptions[source] || 'External data source';
}

// Batch import from multiple sources
export async function batchImportTools(
  options: {
    sources?: string[];
    limit?: number;
    apiKeys?: Record<string, string>;
    dryRun?: boolean;
    page?: number;
  } = {}
): Promise<{
  total: number;
  imported: number;
  updated: number;
  failed: number;
  skipped: number;
  duration: number;
  sources: Record<string, number>;
}> {
  const startTime = Date.now();
  const sourcesToSync = options.sources || ['github', 'npm'];
  
  const results = await syncExternalDataSources(sourcesToSync, {
    apiKeys: options.apiKeys,
    updateExisting: false, // Don't update existing tools by default
    dryRun: options.dryRun,
    page: options.page
  });

  return {
    ...results,
    total: results.imported + results.updated + results.skipped + results.failed,
    duration: Date.now() - startTime
  };
}