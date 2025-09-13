import { 
  type ToolCategory, 
  type Tool, 
  type Compatibility,
  type StackTemplate,
  type StackRule,
  type MigrationPath,
  type InsertToolCategory, 
  type InsertTool, 
  type InsertCompatibility,
  type InsertStackTemplate,
  type InsertStackRule,
  type InsertMigrationPath,
  type ToolWithCategory,
  type CompatibilityMatrix,
  toolCategories as toolCategoriesTable,
  tools as toolsTable,
  compatibilities as compatibilitiesTable,
  migrationPaths as migrationPathsTable,
  toolCategoryJunction
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { DatabaseOptimizer } from "./services/database-optimizer";
import { DatabaseQueryMonitor } from "./middleware/performance-monitoring";

export interface IStorage {
  // Tool Categories
  getToolCategories(): Promise<ToolCategory[]>;
  getToolCategory(id: string): Promise<ToolCategory | undefined>;
  createToolCategory(category: InsertToolCategory): Promise<ToolCategory>;
  updateToolCategory(id: string, category: Partial<InsertToolCategory>): Promise<ToolCategory | undefined>;
  deleteToolCategory(id: string): Promise<boolean>;

  // Tools
  getTools(): Promise<Tool[]>;
  getToolsWithCategory(): Promise<ToolWithCategory[]>;
  getToolsWithAllCategories(): Promise<any[]>;
  getTool(id: string): Promise<Tool | undefined>;
  getToolWithCategory(id: string): Promise<ToolWithCategory | undefined>;
  getToolsByCategory(categoryId: string): Promise<Tool[]>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<boolean>;
  getAlternativeTools(toolId: string): Promise<Tool[]>;
  exportToolsAsCSV(): Promise<string>;

  // Compatibilities
  getCompatibilities(): Promise<Compatibility[]>;
  getCompatibilityMatrix(): Promise<CompatibilityMatrix[]>;
  getCompatibility(toolOneId: string, toolTwoId: string): Promise<Compatibility | undefined>;
  createCompatibility(compatibility: InsertCompatibility): Promise<Compatibility>;
  updateCompatibility(id: string, compatibility: Partial<InsertCompatibility>): Promise<Compatibility | undefined>;
  deleteCompatibilityById(id: string): Promise<boolean>;
  deleteCompatibilityPair(toolOneId: string, toolTwoId: string): Promise<boolean>;

  // Stack Templates
  getStackTemplates(): Promise<StackTemplate[]>;
  getStackTemplate(id: string): Promise<StackTemplate | undefined>;
  createStackTemplate(template: InsertStackTemplate): Promise<StackTemplate>;
  updateStackTemplate(id: string, template: Partial<InsertStackTemplate>): Promise<StackTemplate | undefined>;
  deleteStackTemplate(id: string): Promise<boolean>;

  // Stack Validation & Scoring
  validateStack(toolIds: string[]): Promise<{
    valid: boolean;
    conflicts: Array<{ toolOne: string; toolTwo: string; reason: string }>;
    dependencies: Array<{ tool: string; requires: string[] }>;
    warnings: string[];
    recommendations: string[];
  }>;
  calculateHarmonyScore(toolIds: string[]): Promise<number>;
  getRecommendations(toolIds: string[], category?: string): Promise<Tool[]>;
  getBulkCompatibility(toolIds: string[]): Promise<Array<{
    toolOneId: string;
    toolTwoId: string;
    score: number;
    notes?: string;
  }>>;

  // Migration Paths
  getMigrationPath(fromToolId: string, toToolId: string): Promise<MigrationPath | undefined>;
  createMigrationPath(path: InsertMigrationPath): Promise<MigrationPath>;

  // Export Functions
  exportStackAsJSON(toolIds?: string[]): Promise<any>;
  exportStackAsCSV(toolIds?: string[]): Promise<string>;
  
  // Utility Functions
  clearAllTools(): Promise<void>;
  clearAllCompatibilities(): Promise<void>;
  importToolsFromCSV(): Promise<number>;
  generateCompatibilityScores(): Promise<{ generated: number; updated: number }>;
  
  // StackFast integration methods
  getStackHarmonyScore(toolIds: string[]): Promise<{ harmonyScore: number; toolIds: string[] }>;
}

export class MemStorage implements IStorage {
  private toolCategories: Map<string, ToolCategory>;
  private tools: Map<string, Tool>;
  private compatibilities: Map<string, Compatibility>;

  constructor() {
    this.toolCategories = new Map();
    this.tools = new Map();
    this.compatibilities = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categories = [
      { name: "AI Coding Tools", description: "AI-powered development assistants and code generation", color: "#FF4500" },
      { name: "Frontend/Design", description: "Frontend frameworks, UI libraries, and design tools", color: "#1F6FEB" },
      { name: "Backend/Database", description: "Backend services, databases, and hosting platforms", color: "#238636" },
      { name: "Payment Platforms", description: "Payment processing and financial services", color: "#FB8500" },
      { name: "IDE/Development", description: "Integrated development environments and editors", color: "#8B5CF6" },
      { name: "DevOps/Deployment", description: "Deployment platforms and development operations", color: "#7C3AED" },
    ];

    for (const category of categories) {
      const id = randomUUID();
      this.toolCategories.set(id, { id, ...category });
    }

    // Get category IDs for seeding tools
    const categoryIds = Array.from(this.toolCategories.keys());
    const [aiCategoryId, frontendCategoryId, backendCategoryId, paymentCategoryId, ideCategoryId, devopsCategoryId] = categoryIds;

    // Comprehensive tools from CSV data
    const tools = [
      // AI Coding Tools
      {
        name: "Lovable",
        description: "AI-powered platform for creating full-stack websites via natural language.",
        categoryId: aiCategoryId,
        url: "https://lovable.dev",
        frameworks: ["React", "TypeScript", "Tailwind CSS", "Vite"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Website and app builder", "UI design", "templates"],
        integrations: ["GitHub", "Supabase", "Stripe", "Figma", "OpenAI", "Anthropic"],
        maturityScore: 8.3,
        popularityScore: 8.9,
        pricing: "Free tier, $25 pro tier",
        notes: "End-to-end automation, great for MVPs, user-friendly for non-coders"
      },
      {
        name: "ChatGPT",
        description: "Conversational AI for code generation, debugging, and programming assistance.",
        categoryId: aiCategoryId,
        url: "https://chatgpt.com",
        frameworks: ["React", "Django", "Flask"],
        languages: ["Python", "JavaScript", "TypeScript", "Java", "C++"],
        features: ["Code generation", "debugging", "explanation", "natural language to code"],
        integrations: ["OpenAI API", "GitHub Copilot", "VS Code", "Jupyter"],
        maturityScore: 9.5,
        popularityScore: 9.8,
        pricing: "Free tier, Plus $20/month, Team/Enterprise custom",
        notes: "Versatile, excellent for learning, vast knowledge base"
      },
      {
        name: "Gemini (CLI)",
        description: "Google's AI with CLI for code generation and multimodal inputs.",
        categoryId: aiCategoryId,
        url: "https://gemini.google.com",
        frameworks: ["Android", "Web", "Flutter"],
        languages: ["Java", "Kotlin", "JavaScript", "TypeScript"],
        features: ["Code Assist", "multimodal prompts", "CLI", "Google Cloud integration"],
        integrations: ["Google Cloud", "Android Studio", "VS Code", "JetBrains"],
        maturityScore: 9.0,
        popularityScore: 9.2,
        pricing: "Free with limits, Pro $20/month",
        notes: "Multimodal coding, fast inference, good for mobile/web"
      },
      {
        name: "Cody",
        description: "Enterprise AI code assistant for complex codebases, speed, and consistency.",
        categoryId: aiCategoryId,
        url: "https://sourcegraph.com/cody",
        frameworks: ["All code hosts/editors"],
        languages: ["All programming languages"],
        features: ["Accelerates dev", "reusable prompts", "enterprise-grade security"],
        integrations: ["All code hosts/editors"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "Enterprise custom",
        notes: "Trusted by enterprises, saves 5-6 hours/week, doubles coding speed"
      },
      {
        name: "Claude/Claude Code",
        description: "AI for developers to write/test/debug/analyze codebases.",
        categoryId: aiCategoryId,
        url: "https://www.anthropic.com/solutions/coding",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Write/test/debug", "codebase analysis", "GitHub integration", "terminal embedding"],
        integrations: ["GitHub", "GitLab", "Vercel", "Cursor", "Sourcegraph", "Replit"],
        maturityScore: 8.0,
        popularityScore: 9.0,
        pricing: "Custom pricing",
        notes: "Leads SWE-bench (74.5%), 95% test time reduction, clean code"
      },
      {
        name: "GitHub Copilot",
        description: "AI pair programmer for contextualized code assistance.",
        categoryId: aiCategoryId,
        url: "https://github.com/features/copilot",
        frameworks: ["JavaScript", "OpenAI GPT-5", "Claude Opus 4.1", "Gemini 2.0 Flash"],
        languages: ["All major programming languages"],
        features: ["Code completions", "chat", "explanations", "code review", "Autofix"],
        integrations: ["VS Code", "Visual Studio", "Vim", "Neovim", "JetBrains", "Azure Data Studio"],
        maturityScore: 9.0,
        popularityScore: 9.5,
        pricing: "Free: $0, Pro: $10/month, Pro+: $39/month, Business/Enterprise custom",
        notes: "Widely adopted, 55% productivity boost, multi-model support"
      },
      {
        name: "IBM watsonx Code Assistant",
        description: "AI for faster code creation and modernization across SDLC.",
        categoryId: aiCategoryId,
        url: "https://www.ibm.com/products/watsonx-code-assistant",
        frameworks: ["Python", "Java", "C", "C++", "Go", "JavaScript", "TypeScript"],
        languages: ["Python", "Java", "C", "C++", "Go", "JavaScript", "TypeScript"],
        features: ["Chat recommendations", "automate tasks", "generate/explain/test code", "IP indemnification"],
        integrations: ["Enterprise systems"],
        maturityScore: 8.0,
        popularityScore: 7.0,
        pricing: "30-day free trial, 25% off Essentials Plan for 3 months",
        notes: "IDC MarketScape leader, 90% time savings, 80% legacy code transformed"
      },
      {
        name: "Bolt",
        description: "AI web builder for creating apps/sites via natural language.",
        categoryId: aiCategoryId,
        url: "https://bolt.new",
        frameworks: ["React", "Next.js"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Natural language app building", "UI generation", "code export", "rapid prototyping"],
        integrations: ["Stripe", "GitHub", "OpenAI", "Anthropic"],
        maturityScore: 7.5,
        popularityScore: 8.2,
        pricing: "Custom pricing",
        notes: "Easiest vibe coding, fast MVP creation, user-friendly"
      },
      {
        name: "Cursor",
        description: "AI code editor for predicting edits and natural language coding.",
        categoryId: ideCategoryId,
        url: "https://www.cursor.com",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Predicts edits", "answers codebase queries", "natural language editing"],
        integrations: ["GitHub", "OpenAI", "Anthropic"],
        maturityScore: 7.0,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "Trusted by Samsung/Stripe/Shopify, fast autocompletion"
      },
      {
        name: "v0",
        description: "Vercel's AI tool for generating UI components from natural language.",
        categoryId: frontendCategoryId,
        url: "https://v0.dev",
        frameworks: ["React", "Tailwind CSS"],
        languages: ["JavaScript", "TypeScript"],
        features: ["AI UI generation", "code export", "natural language to design", "templates"],
        integrations: ["Vercel", "GitHub"],
        maturityScore: 8.0,
        popularityScore: 8.5,
        pricing: "Custom pricing",
        notes: "Fast UI prototyping, Vercel ecosystem integration, high-quality code"
      },
      {
        name: "Replit",
        description: "Platform for turning ideas into apps with vibe coding and AI Agent.",
        categoryId: ideCategoryId,
        url: "https://replit.com",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Replit Agent", "design imports from Figma", "built-in Database/Auth", "vibe coding", "SSO"],
        integrations: ["Database", "Auth", "Stripe", "OpenAI"],
        maturityScore: 8.0,
        popularityScore: 9.0,
        pricing: "Custom pricing",
        notes: "Loved by 40M creators, trusted by Google/Anthropic/Coinbase"
      },
      {
        name: "Windsurf",
        description: "AI-powered IDE with deep codebase understanding and real-time collaboration.",
        categoryId: ideCategoryId,
        url: "https://codeium.com/windsurf",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Contextual awareness", "autocomplete", "Previews", "linter", "MCP", "in-line/terminal commands"],
        integrations: ["GitHub", "VS Code extensions"],
        maturityScore: 8.0,
        popularityScore: 9.0,
        pricing: "Custom pricing",
        notes: "Writes 70M+ lines daily, 1M+ users, 94% AI code, 59% Fortune 500"
      },
      {
        name: "Codeium",
        description: "AI code completion tool with suggestions, chat, and search in IDEs.",
        categoryId: ideCategoryId,
        url: "https://codeium.com",
        frameworks: ["70+ languages"],
        languages: ["70+ programming languages"],
        features: ["Autocomplete", "chat for code", "search codebase", "enterprise self-host"],
        integrations: ["VS Code", "JetBrains", "Neovim"],
        maturityScore: 8.0,
        popularityScore: 8.5,
        pricing: "Free for individuals",
        notes: "Free for individuals, fast, privacy-focused"
      },
      {
        name: "Tabnine",
        description: "Contextually aware AI platform for speeding up development with air-gapped deployments.",
        categoryId: ideCategoryId,
        url: "https://www.tabnine.com",
        frameworks: ["Popular languages/libraries/IDEs"],
        languages: ["All major programming languages"],
        features: ["Context-aware suggestions", "bespoke models", "AI agents for review/testing/docs"],
        integrations: ["Atlassian Jira", "All major IDEs"],
        maturityScore: 8.0,
        popularityScore: 9.0,
        pricing: "Custom pricing",
        notes: "Gartner #1, 11% productivity boost, custom suggestions"
      },

      // Frontend/Design Tools
      {
        name: "React",
        description: "A JavaScript library for building user interfaces",
        categoryId: frontendCategoryId,
        url: "https://react.dev",
        frameworks: ["Next.js", "Vite", "Create React App"],
        languages: ["JavaScript", "TypeScript", "JSX"],
        features: ["Component-based", "Virtual DOM", "Hooks", "Server Components"],
        integrations: ["Next.js", "Vite", "Webpack", "Babel"],
        maturityScore: 9.5,
        popularityScore: 9.8,
        pricing: "Free (Open Source)",
        notes: "Most popular frontend library, extensive ecosystem"
      },
      {
        name: "Next.js",
        description: "React framework with server-side rendering and static site generation",
        categoryId: frontendCategoryId,
        url: "https://nextjs.org",
        frameworks: ["React"],
        languages: ["JavaScript", "TypeScript"],
        features: ["SSR", "SSG", "API Routes", "App Router", "Server Components"],
        integrations: ["Vercel", "React", "Tailwind CSS", "Prisma"],
        maturityScore: 9.2,
        popularityScore: 9.5,
        pricing: "Free (Open Source)",
        notes: "Production-ready React framework with excellent developer experience"
      },
      {
        name: "Bubble",
        description: "Full-stack no-code app builder with visual editing and backend.",
        categoryId: frontendCategoryId,
        url: "https://bubble.io",
        frameworks: ["Visual Builder"],
        languages: ["No-code"],
        features: ["Visual app builder", "databases", "workflows", "integrations", "hosting"],
        integrations: ["Stripe", "Google", "various APIs"],
        maturityScore: 8.5,
        popularityScore: 8.7,
        pricing: "Free tier, paid from $25/month",
        notes: "Easy no-code, full-stack, trusted for MVPs"
      },
      {
        name: "Figma",
        description: "Collaborative interface design tool for design/development teams.",
        categoryId: frontendCategoryId,
        url: "https://figma.com",
        frameworks: ["Design tool"],
        languages: ["Design"],
        features: ["Create/refine products", "mockups", "design to code", "design systems", "collaboration"],
        integrations: ["Developer tools", "Design systems"],
        maturityScore: 8.0,
        popularityScore: 9.0,
        pricing: "Custom pricing",
        notes: "Trusted by AirBnb/Asana/Atlassian/GitHub, seamless collaboration"
      },
      {
        name: "Uizard",
        description: "AI-powered UI design tool for rapid prototyping from prompts/sketches.",
        categoryId: frontendCategoryId,
        url: "https://uizard.io",
        frameworks: ["Exports to React", "Figma"],
        languages: ["Design"],
        features: ["AI UI generation", "prototyping", "collaboration", "export code"],
        integrations: ["Figma", "Adobe XD"],
        maturityScore: 7.0,
        popularityScore: 7.5,
        pricing: "Custom pricing",
        notes: "Fast from prompt to UI, focused on design"
      },

      // Backend/Database Tools
      {
        name: "Supabase",
        description: "Postgres development platform with database, auth, APIs, and more.",
        categoryId: backendCategoryId,
        url: "https://supabase.com",
        frameworks: ["ReactJS", "NextJS", "RedwoodJS", "Flutter", "Kotlin", "SvelteKit", "SolidJS", "Vue", "NuxtJS", "Refine"],
        languages: ["SQL", "JavaScript", "TypeScript", "Python"],
        features: ["Postgres database", "Auth", "APIs", "Edge Functions", "Realtime", "Storage", "Vector embeddings"],
        integrations: ["React", "Next.js", "Flutter"],
        maturityScore: 8.0,
        popularityScore: 9.0,
        pricing: "Free tier, Pro plans available",
        notes: "Trusted by Mozilla/GitHub/1Password, quick build/scale"
      },
      {
        name: "Firebase",
        description: "Platform for app development with AI-powered experiences.",
        categoryId: backendCategoryId,
        url: "https://firebase.google.com",
        frameworks: ["iOS", "Android", "Web", "Flutter", "Unity", "C++"],
        languages: ["JavaScript", "Swift", "Kotlin", "C++"],
        features: ["Build AI experiences", "managed infra", "launch/monitor/iterate", "Gemini integration"],
        integrations: ["Gemini", "Google Cloud"],
        maturityScore: 9.0,
        popularityScore: 9.0,
        pricing: "Free tier, pay-as-you-go",
        notes: "Google-backed, trusted by NPR/Duolingo, millions of users"
      },
      {
        name: "Appwrite",
        description: "Open-source backend platform with auth, databases, and hosting.",
        categoryId: backendCategoryId,
        url: "https://appwrite.io",
        frameworks: ["13 languages for serverless functions"],
        languages: ["JavaScript", "Python", "PHP", "Ruby", "Java", "etc."],
        features: ["Auth", "scalable databases", "secure storage", "serverless", "messaging", "Realtime", "hosting"],
        integrations: ["All Appwrite products"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "Free: $0, Pro: $15/month, Scale: $599/month, Enterprise: custom",
        notes: "Loved by Apple/Oracle/TikTok/IBM, wide product range, global scaling"
      },
      {
        name: "Pocketbase",
        description: "Open-source backend in 1 file with database, auth, storage, and dashboard.",
        categoryId: backendCategoryId,
        url: "https://pocketbase.io",
        frameworks: ["JavaScript SDK"],
        languages: ["Go", "JavaScript"],
        features: ["Realtime database", "auth", "file storage", "admin dashboard", "CRUD operations"],
        integrations: ["Frontend stacks"],
        maturityScore: 5.0,
        popularityScore: 5.0,
        pricing: "Free (Open Source)",
        notes: "Ready to use, integrates with frontend stacks"
      },

      // DevOps/Deployment
      {
        name: "Vercel",
        description: "Developer tools and cloud infra for faster, personalized web.",
        categoryId: devopsCategoryId,
        url: "https://vercel.com",
        frameworks: ["Next.js", "React", "Vue", "Svelte"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Build/deploy on AI Cloud", "Git deploys", "collaborative previews", "AI Gateway", "rollbacks"],
        integrations: ["GitHub", "GitLab", "Bitbucket"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "Free tier, Pro plans available",
        notes: "95% page load reduction, globally performant, collaborative"
      },
      {
        name: "Netlify",
        description: "Platform for deploying modern frontend stacks with AI apps.",
        categoryId: devopsCategoryId,
        url: "https://netlify.com",
        frameworks: ["All frontend frameworks"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Optimized builds", "collaborative previews", "instant rollbacks", "global edge", "serverless"],
        integrations: ["GitHub", "GitLab", "Bitbucket"],
        maturityScore: 9.0,
        popularityScore: 9.0,
        pricing: "Free tier, Pro plans available",
        notes: "35M+ projects, 7M+ developers, 99.99% uptime"
      },
      {
        name: "Render",
        description: "Cloud platform for building, deploying, scaling apps.",
        categoryId: devopsCategoryId,
        url: "https://render.com",
        frameworks: ["Node.js", "Python", "Ruby", "Docker"],
        languages: ["JavaScript", "Python", "Ruby"],
        features: ["Web services/static sites/cron jobs", "auto deploys", "datastores", "autoscaling", "IaC"],
        integrations: ["Slack", "GitHub"],
        maturityScore: 8.0,
        popularityScore: 9.0,
        pricing: "Free tier, pay-as-you-go",
        notes: "3M+ developers, 100B requests/month, enterprise-grade"
      },

      // Payment Platforms
      {
        name: "Stripe",
        description: "Payment processing platform for online payments and financial services.",
        categoryId: paymentCategoryId,
        url: "https://stripe.com",
        frameworks: ["JavaScript", "Python", "Ruby", "etc."],
        languages: ["All major programming languages"],
        features: ["Payments", "billing", "fraud prevention", "global support", "APIs"],
        integrations: ["Many e-commerce platforms", "Next.js", "Shopify", "Supabase", "Vercel", "Bubble"],
        maturityScore: 9.5,
        popularityScore: 9.7,
        pricing: "Transaction-based fees",
        notes: "Developer-friendly APIs, reliable, scales for enterprises"
      },
      {
        name: "Plaid",
        description: "Connects bank accounts for payments, verification, and financial data.",
        categoryId: paymentCategoryId,
        url: "https://plaid.com",
        frameworks: ["SDKs for various languages"],
        languages: ["JavaScript", "Python", "Ruby", "Java"],
        features: ["Bank connections", "transactions", "identity verification", "payments"],
        integrations: ["Stripe", "Venmo", "many fintech apps"],
        maturityScore: 9.0,
        popularityScore: 8.5,
        pricing: "API-based pricing",
        notes: "Secure bank links, wide coverage, easy integration"
      },

      // Additional AI Coding Tools
      {
        name: "Devin",
        description: "AI software engineer for coding tasks like migration, refactoring, bug fixing.",
        categoryId: aiCategoryId,
        url: "https://devin.ai",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Code migration", "refactoring", "data engineering", "bug/backlog resolution"],
        integrations: ["GitHub", "Linear", "Slack", "Asana", "Zapier", "Confluence", "Airtable"],
        maturityScore: 7.0,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "8-12x efficiency gains, 20x cost savings, reduces errors"
      },
      {
        name: "AI2sql",
        description: "Generates complex SQL/NoSQL queries from natural language.",
        categoryId: aiCategoryId,
        url: "https://ai2sql.io",
        frameworks: ["SQL", "NoSQL"],
        languages: ["SQL"],
        features: ["Natural language to SQL/NoSQL", "multi-database support", "specialized SQL tools"],
        integrations: ["Database systems"],
        maturityScore: 7.0,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "Simplifies SQL for non-experts, supports SQL/NoSQL"
      },
      {
        name: "Reflection AI",
        description: "AI code research agent for complex codebases and engineering systems.",
        categoryId: aiCategoryId,
        url: "https://reflection.ai",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Understands codebases", "engineering systems", "tribal knowledge"],
        integrations: ["Development systems"],
        maturityScore: 3.0,
        popularityScore: 2.0,
        pricing: "Custom pricing",
        notes: "Team from DeepMind/OpenAI/Anthropic, focuses on LLM/RL/agents"
      },
      {
        name: "Semantic Kernel",
        description: "Open-source kit for building AI agents with C#, Python, Java.",
        categoryId: aiCategoryId,
        url: "https://learn.microsoft.com/en-us/semantic-kernel/overview/",
        frameworks: ["C#", "Python", "Java"],
        languages: ["C#", "Python", "Java"],
        features: ["Build AI agents", "integrate AI models", "modular plugins", "OpenAPI support"],
        integrations: ["Microsoft ecosystem"],
        maturityScore: 8.0,
        popularityScore: 7.0,
        pricing: "Free (Open Source)",
        notes: "Flexible, Microsoft-backed, enterprise-ready security"
      },
      {
        name: "LangChain",
        description: "Open-source framework for building AI agents with LLMs.",
        categoryId: aiCategoryId,
        url: "https://www.langchain.com",
        frameworks: ["Python", "JavaScript"],
        languages: ["Python", "JavaScript"],
        features: ["Agent building", "LLM integrations", "chaining prompts/tools", "memory", "RAG"],
        integrations: ["OpenAI", "Anthropic", "various databases", "Hugging Face", "Pinecone"],
        maturityScore: 8.5,
        popularityScore: 9.0,
        pricing: "Free (Open Source)",
        notes: "Flexible for agentic AI, widely used, community support"
      },
      {
        name: "CrewAI",
        description: "Framework for orchestrating role-playing autonomous AI agents.",
        categoryId: aiCategoryId,
        url: "https://crewai.com",
        frameworks: ["Python"],
        languages: ["Python"],
        features: ["Role-based agents", "task delegation", "multi-agent workflows", "LLM integration"],
        integrations: ["OpenAI", "Anthropic"],
        maturityScore: 7.5,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "Easy multi-agent setup, good for automation, community"
      },
      {
        name: "AutoGen",
        description: "Microsoft's framework for building multi-agent AI systems.",
        categoryId: aiCategoryId,
        url: "https://microsoft.github.io/autogen/",
        frameworks: ["Python"],
        languages: ["Python"],
        features: ["Multi-agent orchestration", "event-driven architecture", "API integration"],
        integrations: ["Microsoft Azure", "OpenAI"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "Free (Open Source)",
        notes: "Strong for enterprise, good docs, Semantic Kernel integration"
      },
      {
        name: "gocodeo",
        description: "AI unit test generator for automating code testing.",
        categoryId: aiCategoryId,
        url: "https://www.gocodeo.com",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["AI code generation", "project setup", "testing", "real-time AI coding", "auto-debugging"],
        integrations: ["VS Code"],
        maturityScore: 7.0,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "Trusted by 25,000+ engineers, 55% coding speed increase"
      },
      {
        name: "Amazon CodeWhisperer",
        description: "AI coding companion with AWS integration for code suggestions.",
        categoryId: ideCategoryId,
        url: "https://aws.amazon.com/codewhisperer/",
        frameworks: ["15+ languages"],
        languages: ["Python", "Java", "JavaScript", "TypeScript", "C#", "etc."],
        features: ["Code suggestions", "security scans", "reference tracker", "AWS-specific code"],
        integrations: ["AWS", "VS Code", "JetBrains"],
        maturityScore: 8.0,
        popularityScore: 7.5,
        pricing: "Free for individuals",
        notes: "Free for individuals, good for cloud devs, security focus"
      },
      {
        name: "Blackbox",
        description: "AI-powered coding assistant for code generation, autocompletion, and debugging.",
        categoryId: ideCategoryId,
        url: "https://www.blackbox.ai",
        frameworks: ["Python", "JavaScript", "TypeScript", "Go", "C", "C++", "Java", "C#"],
        languages: ["70+ programming languages"],
        features: ["Code generation", "autocompletion", "debugging", "Figma to code", "image to web app", "voice interaction"],
        integrations: ["VS Code", "GitHub"],
        maturityScore: 7.0,
        popularityScore: 7.5,
        pricing: "Custom pricing",
        notes: "Trusted by 10M+ users, supports 70+ languages"
      },

      // Additional IDE/Development Tools
      {
        name: "Zed",
        description: "High-performance, collaborative code editor with AI integrations.",
        categoryId: ideCategoryId,
        url: "https://zed.dev",
        frameworks: ["Rust-based", "multiple languages"],
        languages: ["All major programming languages"],
        features: ["AI autocomplete", "collaboration", "high speed", "Git integration"],
        integrations: ["GitHub Copilot", "OpenAI"],
        maturityScore: 7.0,
        popularityScore: 7.0,
        pricing: "Free",
        notes: "Fastest editor, multiplayer editing, modern UI"
      },
      {
        name: "Kiro AI",
        description: "AI IDE for spec-driven development and collaboration.",
        categoryId: ideCategoryId,
        url: "https://kiro.dev",
        frameworks: ["Claude Sonnet 3.7/4", "Open VSX plugins"],
        languages: ["All programming languages"],
        features: ["Spec-driven dev", "multimodal chat", "agent hooks", "autopilot", "MCP integration"],
        integrations: ["MCP for docs/databases/APIs"],
        maturityScore: 7.0,
        popularityScore: 6.0,
        pricing: "Free to start",
        notes: "Structures AI coding, automates tasks, multimodal inputs"
      },
      {
        name: "Cline",
        description: "Autonomous coding agent in IDE for file creation/editing and web tasks.",
        categoryId: ideCategoryId,
        url: "https://github.com/cline/cline",
        frameworks: ["OpenRouter", "Anthropic", "OpenAI", "Google Gemini", "AWS Bedrock", "Azure", "GCP Vertex"],
        languages: ["All programming languages"],
        features: ["File analysis/editing", "terminal commands", "headless browser", "MCP", "context via @mentions"],
        integrations: ["VSCode"],
        maturityScore: 7.0,
        popularityScore: 6.0,
        pricing: "Free (Open Source)",
        notes: "Handles complex tasks, supports large projects, interactive debugging"
      },
      {
        name: "AIder",
        description: "AI pair programming tool for terminal-based collaboration with LLMs.",
        categoryId: aiCategoryId,
        url: "https://aider.chat",
        frameworks: ["Python", "DeepSeek", "Claude 3.7 Sonnet", "o3-mini"],
        languages: ["Python", "All programming languages"],
        features: ["Pair programming", "start/work on projects", "supports multiple LLMs"],
        integrations: ["Terminal", "Multiple LLMs"],
        maturityScore: 5.0,
        popularityScore: 3.0,
        pricing: "Custom pricing",
        notes: "AI-assisted terminal coding, multi-LLM support"
      },

      // Additional Frontend/Design Tools
      {
        name: "Tempo Labs",
        description: "Platform for collaborative React app building with AI and drag-and-drop.",
        categoryId: frontendCategoryId,
        url: "https://www.tempo.new",
        frameworks: ["React"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Visual React editing", "design systems", "VSCode/GitHub integration", "AI generation"],
        integrations: ["GitHub", "VSCode", "Storybook"],
        maturityScore: 6.0,
        popularityScore: 5.0,
        pricing: "Free: $0, Pro: $30/month, Agent+: $4,000/month",
        notes: "Designer/developer collaboration, visual editing, free/paid AI"
      },
      {
        name: "Balsamiq",
        description: "Wireframing tool for quick, low-fidelity wireframes to align teams.",
        categoryId: frontendCategoryId,
        url: "https://balsamiq.com",
        frameworks: ["Design tool"],
        languages: ["Design"],
        features: ["Drag-and-drop UI", "share via links/exports", "low-fidelity design", "templates"],
        integrations: ["Design workflow"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "Reduces rework, aligns teams, easy to use"
      },
      {
        name: "Locofy.ai",
        description: "Converts Figma/Adobe XD designs to code automatically.",
        categoryId: frontendCategoryId,
        url: "https://www.locofy.ai",
        frameworks: ["React", "HTML/CSS", "Gatsby"],
        languages: ["JavaScript", "TypeScript", "HTML", "CSS"],
        features: ["Design to code conversion", "component export", "responsive code"],
        integrations: ["Figma", "Adobe XD"],
        maturityScore: 6.5,
        popularityScore: 7.0,
        pricing: "Custom pricing",
        notes: "Saves time on frontend coding, accurate conversions"
      },
      {
        name: "Softgen",
        description: "AI tool for creating web apps via natural language with tailored roadmaps.",
        categoryId: frontendCategoryId,
        url: "https://softgen.ai",
        frameworks: ["Web frameworks"],
        languages: ["JavaScript", "TypeScript"],
        features: ["AI roadmap", "emails", "payments", "auth", "database", "SEO", "UI components"],
        integrations: ["Emails", "Payments", "Auth", "Database", "Realtime Database", "Cloud Storage", "SEO", "UI Components"],
        maturityScore: 5.0,
        popularityScore: 6.0,
        pricing: "Custom pricing",
        notes: "AI-driven roadmap generation for web apps"
      },

      // Additional Backend/Database Tools  
      {
        name: "Knack",
        description: "No-code platform for data-rich web apps like SaaS, portals, internal tools.",
        categoryId: backendCategoryId,
        url: "https://www.knack.com",
        frameworks: ["No-code platform"],
        languages: ["No-code"],
        features: ["Visual builder", "no-code database", "automation", "triggers", "templates"],
        integrations: ["Various APIs and services"],
        maturityScore: 8.0,
        popularityScore: 7.0,
        pricing: "Custom pricing",
        notes: "Rapid development, predictable costs, 92% retention"
      },
      {
        name: "GibsonAI",
        description: "AI for instant serverless SQL database design/deployment/management.",
        categoryId: backendCategoryId,
        url: "https://www.gibsonai.com",
        frameworks: ["PostgreSQL", "MySQL", "Neon", "Windsurf", "Cursor", "VScode", "CLI", "Python", "TypeScript", "NextJS"],
        languages: ["SQL", "Python", "TypeScript"],
        features: ["Instant schema", "zero downtime migrations", "API endpoints", "natural language to SQL"],
        integrations: ["PostgreSQL", "MySQL", "Neon", "Windsurf", "Cursor", "VScode", "CLI"],
        maturityScore: 5.0,
        popularityScore: 4.0,
        pricing: "Free to start",
        notes: "Speed in database creation, AI-native, cost-efficient"
      },
      {
        name: "Base44",
        description: "AI platform for turning ideas into custom apps without coding.",
        categoryId: backendCategoryId,
        url: "https://base44.com",
        frameworks: ["All frameworks"],
        languages: ["No-code"],
        features: ["Build apps in minutes", "auto components/pages/flows", "backend (auth, data)", "hosting"],
        integrations: ["Email", "SMS", "external APIs", "database querying"],
        maturityScore: 7.0,
        popularityScore: 8.0,
        pricing: "Free core features, paid from $20/month",
        notes: "No coding required, fast deployment, 400K+ users"
      },
      {
        name: "Nhost",
        description: "Managed, extensible backend platform for speed, flexibility, and scale.",
        categoryId: backendCategoryId,
        url: "https://nhost.io",
        frameworks: ["SDKs (specific not detailed)"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Scales with user", "CI/CD", "observability", "CLI/dashboard", "global deployment", "auth SDKs"],
        integrations: ["Frontend frameworks"],
        maturityScore: 7.0,
        popularityScore: 7.0,
        pricing: "Free tier",
        notes: "Rapid dev, case studies (400K+ users in 6 weeks), reduces onboarding"
      },
      {
        name: "UI Bakery",
        description: "Low-code platform for building custom internal tools, portals, dashboards.",
        categoryId: frontendCategoryId,
        url: "https://uibakery.io",
        frameworks: ["JavaScript", "Python", "SQL"],
        languages: ["JavaScript", "Python", "SQL"],
        features: ["Drag-and-drop UI", "30+ integrations", "code/no-code logic", "Git", "one-click deployment"],
        integrations: ["18+ databases", "17+ services/APIs", "REST/OpenAPI/GraphQL"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "See https://uibakery.io/pricing",
        notes: "Rapid dev, high customization, G2 4.9/5"
      },
      {
        name: "Backendless",
        description: "Platform for scalable apps with AI-driven automation.",
        categoryId: backendCategoryId,
        url: "https://backendless.com",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Build scalable apps", "automate workflows", "no-code/low-code", "flexible hosting"],
        integrations: ["Various services"],
        maturityScore: 7.0,
        popularityScore: 6.0,
        pricing: "Cloud/Pro/Managed plans",
        notes: "Flexible backend, intuitive interface, quick POC"
      },

      // Additional DevOps/Deployment Tools
      {
        name: "Northflank",
        description: "Cloud platform for deploying any project from first user to billions.",
        categoryId: devopsCategoryId,
        url: "https://northflank.com",
        frameworks: ["Any language/framework", "GitHub/GitLab/Bitbucket", "Kubernetes (EKS/GKE/AKS)"],
        languages: ["All programming languages"],
        features: ["UI/CLI/APIs/GitOps", "runs on AWS/GCP/Azure/Oracle", "templates", "secure code", "vectorDBs"],
        integrations: ["GitHub", "GitLab", "Bitbucket"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "CPU $0.01667/hr, Memory $0.00833/hr, NVIDIA H100 $2.74/hr, etc.",
        notes: "Trusted by 2,000+ startups/enterprises, scales to 3M users"
      },
      {
        name: "Platform.sh",
        description: "Self-service PaaS for efficient, reliable, secure infrastructure.",
        categoryId: devopsCategoryId,
        url: "https://platform.sh",
        frameworks: ["100+ frameworks", "14 languages"],
        languages: ["14 programming languages"],
        features: ["Automated infra", "Git workflows", "multicloud/multistack", "scalability", "Observability Suite"],
        integrations: ["Git workflows"],
        maturityScore: 8.0,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "5,000+ customers (Adobe/Economist), 219% ROI, G2 leader"
      },
      {
        name: "Codev",
        description: "Converts text to full-stack Next.js apps with deployment and ownership.",
        categoryId: devopsCategoryId,
        url: "https://www.co.dev",
        frameworks: ["Next.js", "Supabase (PostgreSQL)"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Text to app", "components/styling/functionality", "package install", "domain setup", "CRUD"],
        integrations: ["Next.js", "Supabase"],
        maturityScore: 7.0,
        popularityScore: 8.0,
        pricing: "Custom pricing",
        notes: "Rapid community growth (40K+ builders), production-ready in minutes"
      },
      {
        name: "ByteAI",
        description: "Smart UML playground for technical strategies with AI tips.",
        categoryId: frontendCategoryId,
        url: "https://byte-ai.io",
        frameworks: ["JavaScript", "Python", "Node.js", "C#", "C++"],
        languages: ["JavaScript", "Python", "Node.js", "C#", "C++"],
        features: ["Visual module builder", "team collaboration", "code assistant", "AI tips"],
        integrations: ["Future GitHub integration"],
        maturityScore: 6.0,
        popularityScore: 5.0,
        pricing: "Free Trial: $0/mo, Startup: $45/mo, Company: $299/mo, Custom",
        notes: "Visualization, 55% coding speed increase, reduces tech debt"
      },
      
      // Additional 15 tools to reach 71 total
      {
        name: "Continue",
        description: "Open-source AI code assistant with deep IDE integration.",
        categoryId: aiCategoryId,
        url: "https://continue.dev",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Code completion", "chat with codebase", "refactoring", "custom models"],
        integrations: ["VS Code", "JetBrains", "OpenAI", "Anthropic", "Ollama"],
        maturityScore: 8.5,
        popularityScore: 8.7,
        pricing: "Free (Open Source)",
        notes: "Privacy-focused, works offline with local models"
      },
      {
        name: "Codeshot",
        description: "Generate code snippets and beautiful screenshots from natural language.",
        categoryId: aiCategoryId,
        url: "https://codeshot.dev",
        frameworks: ["React", "Vue", "Angular"],
        languages: ["JavaScript", "TypeScript", "Python"],
        features: ["Code generation", "screenshot creation", "syntax highlighting", "export options"],
        integrations: ["GitHub", "VS Code"],
        maturityScore: 7.0,
        popularityScore: 6.5,
        pricing: "Free tier, Pro $10/month",
        notes: "Great for documentation and sharing code"
      },
      {
        name: "Dify",
        description: "Open-source LLM app development platform for AI-native applications.",
        categoryId: aiCategoryId,
        url: "https://dify.ai",
        frameworks: ["Python", "TypeScript"],
        languages: ["Python", "TypeScript"],
        features: ["LLM orchestration", "RAG engine", "agent frameworks", "workflow automation"],
        integrations: ["OpenAI", "Anthropic", "Hugging Face", "Local LLMs"],
        maturityScore: 8.0,
        popularityScore: 8.2,
        pricing: "Free self-hosted, Cloud from $0",
        notes: "Enterprise-ready, visual development interface"
      },
      {
        name: "Pieces",
        description: "AI-powered code snippet manager with context awareness.",
        categoryId: ideCategoryId,
        url: "https://pieces.app",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Snippet management", "AI context", "cross-platform sync", "code extraction"],
        integrations: ["VS Code", "JetBrains", "Chrome", "Obsidian"],
        maturityScore: 8.0,
        popularityScore: 7.5,
        pricing: "Free personal, Team $15/user/month",
        notes: "Excellent for managing and sharing code snippets"
      },
      {
        name: "Sourcery",
        description: "AI-powered code review and refactoring assistant for Python.",
        categoryId: aiCategoryId,
        url: "https://sourcery.ai",
        frameworks: ["Django", "Flask", "FastAPI"],
        languages: ["Python"],
        features: ["Automated refactoring", "code review", "quality metrics", "best practices"],
        integrations: ["VS Code", "PyCharm", "GitHub", "GitLab"],
        maturityScore: 8.5,
        popularityScore: 7.8,
        pricing: "Free tier, Pro $10/month",
        notes: "Python-specific, improves code quality automatically"
      },
      {
        name: "Railway",
        description: "Infrastructure platform for deploying web apps with zero config.",
        categoryId: devopsCategoryId,
        url: "https://railway.app",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Auto-deploy", "database provisioning", "environment management", "team collaboration"],
        integrations: ["GitHub", "PostgreSQL", "Redis", "MongoDB"],
        maturityScore: 8.0,
        popularityScore: 8.3,
        pricing: "Hobby $5/month, Pro $20/month",
        notes: "Simpler than Kubernetes, faster than traditional PaaS"
      },
      {
        name: "Coolify",
        description: "Open-source self-hostable Heroku/Netlify alternative.",
        categoryId: devopsCategoryId,
        url: "https://coolify.io",
        frameworks: ["All frameworks"],
        languages: ["All programming languages"],
        features: ["Self-hosting", "automatic SSL", "database management", "GitOps"],
        integrations: ["GitHub", "GitLab", "Docker"],
        maturityScore: 7.5,
        popularityScore: 7.8,
        pricing: "Free (Open Source)",
        notes: "Complete control over infrastructure, privacy-focused"
      },
      {
        name: "Plasmic",
        description: "Visual builder for React applications with code export.",
        categoryId: frontendCategoryId,
        url: "https://www.plasmic.app",
        frameworks: ["React", "Next.js", "Gatsby"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Visual editing", "code sync", "CMS", "component marketplace"],
        integrations: ["React", "Next.js", "Gatsby", "Figma"],
        maturityScore: 8.5,
        popularityScore: 8.0,
        pricing: "Free tier, Team $28/user/month",
        notes: "Bridge between design and code, developer-friendly"
      },
      {
        name: "Builder.io",
        description: "Visual development platform for creating digital experiences.",
        categoryId: frontendCategoryId,
        url: "https://www.builder.io",
        frameworks: ["React", "Vue", "Angular", "Next.js"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Visual CMS", "A/B testing", "personalization", "headless architecture"],
        integrations: ["Shopify", "React", "Vue", "Angular"],
        maturityScore: 9.0,
        popularityScore: 8.5,
        pricing: "Free tier, Growth $99/month",
        notes: "Enterprise-grade, excellent for marketing teams"
      },
      {
        name: "Retool",
        description: "Low-code platform for building internal tools quickly.",
        categoryId: frontendCategoryId,
        url: "https://retool.com",
        frameworks: ["JavaScript", "SQL"],
        languages: ["JavaScript", "SQL", "Python"],
        features: ["Drag-drop UI", "database connectors", "API integrations", "custom code"],
        integrations: ["PostgreSQL", "MySQL", "MongoDB", "REST APIs"],
        maturityScore: 9.0,
        popularityScore: 9.0,
        pricing: "Free tier, Team $10/user/month",
        notes: "Industry standard for internal tools"
      },
      {
        name: "Appsmith",
        description: "Open-source low-code platform for building internal apps.",
        categoryId: frontendCategoryId,
        url: "https://www.appsmith.com",
        frameworks: ["JavaScript"],
        languages: ["JavaScript", "SQL"],
        features: ["Visual builder", "database integration", "REST/GraphQL", "Git sync"],
        integrations: ["PostgreSQL", "MongoDB", "REST APIs", "GraphQL"],
        maturityScore: 8.0,
        popularityScore: 8.2,
        pricing: "Free self-hosted, Cloud from $0",
        notes: "Open-source Retool alternative"
      },
      {
        name: "Directus",
        description: "Open-source data platform for headless CMS and API.",
        categoryId: backendCategoryId,
        url: "https://directus.io",
        frameworks: ["Node.js", "Vue.js"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Headless CMS", "REST/GraphQL API", "data studio", "workflows"],
        integrations: ["PostgreSQL", "MySQL", "SQLite", "MongoDB"],
        maturityScore: 8.5,
        popularityScore: 8.0,
        pricing: "Free self-hosted, Cloud from $15/month",
        notes: "Database-first approach, very flexible"
      },
      {
        name: "Strapi",
        description: "Open-source headless CMS for building APIs quickly.",
        categoryId: backendCategoryId,
        url: "https://strapi.io",
        frameworks: ["Node.js", "React"],
        languages: ["JavaScript", "TypeScript"],
        features: ["Content types builder", "REST/GraphQL", "media library", "i18n"],
        integrations: ["PostgreSQL", "MySQL", "SQLite", "MongoDB"],
        maturityScore: 9.0,
        popularityScore: 9.2,
        pricing: "Free self-hosted, Cloud from $99/month",
        notes: "Most popular open-source headless CMS"
      },
      {
        name: "Hygraph",
        description: "GraphQL-native headless CMS with content federation.",
        categoryId: backendCategoryId,
        url: "https://hygraph.com",
        frameworks: ["GraphQL"],
        languages: ["All via GraphQL"],
        features: ["GraphQL API", "content federation", "webhooks", "localization"],
        integrations: ["Next.js", "Gatsby", "Remix", "Vercel"],
        maturityScore: 8.5,
        popularityScore: 7.8,
        pricing: "Free tier, Pro from $299/month",
        notes: "Formerly GraphCMS, excellent for GraphQL projects"
      },
      {
        name: "Convex",
        description: "Backend platform with real-time sync and serverless functions.",
        categoryId: backendCategoryId,
        url: "https://www.convex.dev",
        frameworks: ["React", "Next.js", "Vue"],
        languages: ["TypeScript", "JavaScript"],
        features: ["Real-time sync", "serverless functions", "ACID transactions", "type safety"],
        integrations: ["React", "Next.js", "Clerk", "Auth0"],
        maturityScore: 7.5,
        popularityScore: 7.0,
        pricing: "Free tier, Pro $25/month",
        notes: "Modern Firebase alternative with better DX"
      }
    ];

    for (const tool of tools) {
      const id = randomUUID();
      this.tools.set(id, { id, ...tool });
    }

    // Generate comprehensive compatibility data based on actual integrations and logical relationships
    const toolIds = Array.from(this.tools.keys());
    const toolsArray = Array.from(this.tools.values());
    const compatibilities = [];
    
    // Helper function to find tool index by name
    const findToolIndex = (name: string) => toolsArray.findIndex(t => t.name === name);
    
    // Create compatibility map based on actual integrations and categories
    const compatibilityMap = new Map();
    
    // Function to add compatibility (handles bidirectional)
    const addCompatibility = (idx1: number, idx2: number, score: number, note: string, verified = 1) => {
      if (idx1 === -1 || idx2 === -1 || idx1 === idx2) return;
      const key = idx1 < idx2 ? `${idx1}-${idx2}` : `${idx2}-${idx1}`;
      if (!compatibilityMap.has(key)) {
        compatibilityMap.set(key, {
          toolOneId: toolIds[idx1 < idx2 ? idx1 : idx2],
          toolTwoId: toolIds[idx1 < idx2 ? idx2 : idx1],
          compatibilityScore: score,
          notes: note,
          verifiedIntegration: verified
        });
      }
    };

    // 1. Direct integrations from CSV data (highest compatibility)
    // Lovable integrations
    addCompatibility(findToolIndex("Lovable"), findToolIndex("Supabase"), 95, "Native Supabase integration in Lovable");
    addCompatibility(findToolIndex("Lovable"), findToolIndex("Stripe"), 95, "Native Stripe integration in Lovable");
    addCompatibility(findToolIndex("Lovable"), findToolIndex("React"), 98, "Lovable generates React code natively");
    addCompatibility(findToolIndex("Lovable"), findToolIndex("Figma"), 90, "Lovable imports from Figma");
    
    // ChatGPT integrations
    addCompatibility(findToolIndex("ChatGPT"), findToolIndex("GitHub Copilot"), 85, "Both use OpenAI models, complementary tools");
    addCompatibility(findToolIndex("ChatGPT"), findToolIndex("Cursor"), 80, "ChatGPT can assist with Cursor development");
    
    // GitHub Copilot integrations
    addCompatibility(findToolIndex("GitHub Copilot"), findToolIndex("Cursor"), 90, "Cursor has native GitHub Copilot support");
    addCompatibility(findToolIndex("GitHub Copilot"), findToolIndex("Windsurf"), 88, "Windsurf supports GitHub Copilot");
    addCompatibility(findToolIndex("GitHub Copilot"), findToolIndex("Zed"), 85, "Zed integrates with GitHub Copilot");
    addCompatibility(findToolIndex("GitHub Copilot"), findToolIndex("Codeium"), 70, "Competing but can work in different IDEs");
    
    // Claude integrations
    addCompatibility(findToolIndex("Claude/Claude Code"), findToolIndex("Cursor"), 95, "Cursor has excellent Claude integration");
    addCompatibility(findToolIndex("Claude/Claude Code"), findToolIndex("Replit"), 90, "Replit integrates Claude");
    addCompatibility(findToolIndex("Claude/Claude Code"), findToolIndex("Vercel"), 85, "Claude works with Vercel deployments");
    
    // Bolt integrations
    addCompatibility(findToolIndex("Bolt"), findToolIndex("React"), 92, "Bolt generates React apps");
    addCompatibility(findToolIndex("Bolt"), findToolIndex("Next.js"), 95, "Bolt has excellent Next.js support");
    addCompatibility(findToolIndex("Bolt"), findToolIndex("Stripe"), 85, "Bolt can integrate Stripe");
    addCompatibility(findToolIndex("Bolt"), findToolIndex("Supabase"), 80, "Bolt can integrate Supabase via prompts");
    
    // v0 (Vercel) integrations
    addCompatibility(findToolIndex("v0"), findToolIndex("React"), 98, "v0 is built for React");
    addCompatibility(findToolIndex("v0"), findToolIndex("Next.js"), 98, "v0 is optimized for Next.js");
    addCompatibility(findToolIndex("v0"), findToolIndex("Vercel"), 100, "v0 is Vercel's product");
    addCompatibility(findToolIndex("v0"), findToolIndex("Supabase"), 85, "v0 can integrate Supabase");
    
    // Replit integrations
    addCompatibility(findToolIndex("Replit"), findToolIndex("Stripe"), 90, "Replit has Stripe integration");
    addCompatibility(findToolIndex("Replit"), findToolIndex("Supabase"), 85, "Replit works with Supabase");
    addCompatibility(findToolIndex("Replit"), findToolIndex("Firebase"), 85, "Replit works with Firebase");
    addCompatibility(findToolIndex("Replit"), findToolIndex("Figma"), 85, "Replit imports from Figma");
    
    // Frontend framework relationships
    addCompatibility(findToolIndex("React"), findToolIndex("Next.js"), 98, "Next.js is built on React");
    addCompatibility(findToolIndex("React"), findToolIndex("Vercel"), 90, "Vercel optimized for React");
    addCompatibility(findToolIndex("React"), findToolIndex("Netlify"), 90, "Netlify deploys React apps");
    addCompatibility(findToolIndex("React"), findToolIndex("Supabase"), 92, "Supabase has React SDK");
    addCompatibility(findToolIndex("React"), findToolIndex("Firebase"), 92, "Firebase has React SDK");
    addCompatibility(findToolIndex("React"), findToolIndex("Stripe"), 90, "Stripe has React components");
    
    // Next.js integrations
    addCompatibility(findToolIndex("Next.js"), findToolIndex("Vercel"), 100, "Vercel created and optimizes for Next.js");
    addCompatibility(findToolIndex("Next.js"), findToolIndex("Netlify"), 88, "Netlify supports Next.js");
    addCompatibility(findToolIndex("Next.js"), findToolIndex("Supabase"), 95, "Excellent Next.js + Supabase integration");
    addCompatibility(findToolIndex("Next.js"), findToolIndex("Stripe"), 92, "Next.js has great Stripe support");
    addCompatibility(findToolIndex("Next.js"), findToolIndex("Firebase"), 88, "Firebase works well with Next.js");
    
    // Backend service relationships
    addCompatibility(findToolIndex("Supabase"), findToolIndex("Stripe"), 95, "Supabase has built-in Stripe integration");
    addCompatibility(findToolIndex("Supabase"), findToolIndex("Vercel"), 90, "Vercel and Supabase work excellently together");
    addCompatibility(findToolIndex("Supabase"), findToolIndex("Netlify"), 88, "Netlify can deploy Supabase apps");
    addCompatibility(findToolIndex("Firebase"), findToolIndex("Stripe"), 90, "Firebase integrates well with Stripe");
    addCompatibility(findToolIndex("Firebase"), findToolIndex("Vercel"), 85, "Firebase works with Vercel");
    addCompatibility(findToolIndex("Appwrite"), findToolIndex("Stripe"), 85, "Appwrite can integrate Stripe");
    
    // IDE relationships
    addCompatibility(findToolIndex("Cursor"), findToolIndex("Windsurf"), 60, "Both are AI-powered IDEs, typically used separately");
    addCompatibility(findToolIndex("Cursor"), findToolIndex("Codeium"), 75, "Can use Codeium features in Cursor");
    addCompatibility(findToolIndex("Windsurf"), findToolIndex("Codeium"), 80, "Windsurf is by Codeium team");
    addCompatibility(findToolIndex("Tabnine"), findToolIndex("Amazon CodeWhisperer"), 65, "Competing tools but can coexist");
    
    // Payment platform relationships
    addCompatibility(findToolIndex("Stripe"), findToolIndex("Plaid"), 85, "Stripe and Plaid complement for payments");
    
    // Design tool relationships  
    addCompatibility(findToolIndex("Figma"), findToolIndex("React"), 85, "Figma designs export to React");
    addCompatibility(findToolIndex("Figma"), findToolIndex("Uizard"), 80, "Uizard integrates with Figma");
    addCompatibility(findToolIndex("Figma"), findToolIndex("Locofy.ai"), 90, "Locofy converts Figma to code");
    
    // No-code/Low-code platform relationships
    addCompatibility(findToolIndex("Bubble"), findToolIndex("Stripe"), 90, "Bubble has native Stripe integration");
    addCompatibility(findToolIndex("Bubble"), findToolIndex("Supabase"), 75, "Bubble can connect to Supabase");
    
    // AI Framework relationships
    addCompatibility(findToolIndex("LangChain"), findToolIndex("ChatGPT"), 95, "LangChain integrates OpenAI/ChatGPT");
    addCompatibility(findToolIndex("LangChain"), findToolIndex("Claude/Claude Code"), 95, "LangChain integrates Anthropic/Claude");
    addCompatibility(findToolIndex("CrewAI"), findToolIndex("ChatGPT"), 90, "CrewAI uses OpenAI models");
    addCompatibility(findToolIndex("AutoGen"), findToolIndex("ChatGPT"), 90, "AutoGen integrates OpenAI");
    addCompatibility(findToolIndex("Semantic Kernel"), findToolIndex("ChatGPT"), 90, "Microsoft's SK integrates OpenAI");
    
    // Deployment platform relationships
    addCompatibility(findToolIndex("Vercel"), findToolIndex("Netlify"), 50, "Competing platforms, typically use one or the other");
    addCompatibility(findToolIndex("Vercel"), findToolIndex("Render"), 55, "Alternative deployment platforms");
    addCompatibility(findToolIndex("Netlify"), findToolIndex("Render"), 55, "Alternative deployment platforms");
    
    // Database tool relationships
    addCompatibility(findToolIndex("Pocketbase"), findToolIndex("React"), 80, "Pocketbase has JavaScript SDK for React");
    addCompatibility(findToolIndex("Nhost"), findToolIndex("React"), 85, "Nhost works well with React");
    addCompatibility(findToolIndex("GibsonAI"), findToolIndex("Cursor"), 85, "GibsonAI integrates with Cursor");
    addCompatibility(findToolIndex("GibsonAI"), findToolIndex("Windsurf"), 85, "GibsonAI integrates with Windsurf");
    
    // Additional AI coding tool relationships
    addCompatibility(findToolIndex("Devin"), findToolIndex("Stripe"), 80, "Devin has Stripe integration");
    addCompatibility(findToolIndex("Devin"), findToolIndex("Supabase"), 75, "Devin can work with databases");
    addCompatibility(findToolIndex("AI2sql"), findToolIndex("Supabase"), 85, "AI2sql helps with Supabase queries");
    addCompatibility(findToolIndex("AI2sql"), findToolIndex("Firebase"), 75, "AI2sql can generate NoSQL queries");
    
    // More IDE and tool relationships
    addCompatibility(findToolIndex("Kiro AI"), findToolIndex("Claude/Claude Code"), 90, "Kiro AI uses Claude models");
    addCompatibility(findToolIndex("Cline"), findToolIndex("ChatGPT"), 85, "Cline supports OpenAI");
    addCompatibility(findToolIndex("Cline"), findToolIndex("Claude/Claude Code"), 85, "Cline supports Anthropic");
    addCompatibility(findToolIndex("AIder"), findToolIndex("Claude/Claude Code"), 85, "AIder supports Claude");
    
    // Frontend tool relationships
    addCompatibility(findToolIndex("Tempo Labs"), findToolIndex("React"), 95, "Tempo Labs is for React development");
    addCompatibility(findToolIndex("UI Bakery"), findToolIndex("React"), 80, "UI Bakery can export to React");
    addCompatibility(findToolIndex("Base44"), findToolIndex("Stripe"), 80, "Base44 can integrate payments");
    
    // DevOps relationships
    addCompatibility(findToolIndex("Northflank"), findToolIndex("React"), 85, "Northflank deploys React apps");
    addCompatibility(findToolIndex("Platform.sh"), findToolIndex("Next.js"), 85, "Platform.sh supports Next.js");
    addCompatibility(findToolIndex("Codev"), findToolIndex("Next.js"), 95, "Codev generates Next.js apps");
    addCompatibility(findToolIndex("Codev"), findToolIndex("Supabase"), 95, "Codev uses Supabase for backend");
    
    // Cross-category logical relationships based on common use cases
    // All AI coding tools should work reasonably well with major frameworks
    const aiTools = ["ChatGPT", "Gemini (CLI)", "Cody", "Claude/Claude Code", "GitHub Copilot"];
    const frameworks = ["React", "Next.js"];
    const backends = ["Supabase", "Firebase"];
    
    for (const ai of aiTools) {
      for (const framework of frameworks) {
        const aiIdx = findToolIndex(ai);
        const frameworkIdx = findToolIndex(framework);
        if (aiIdx !== -1 && frameworkIdx !== -1 && !compatibilityMap.has(`${Math.min(aiIdx, frameworkIdx)}-${Math.max(aiIdx, frameworkIdx)}`)) {
          addCompatibility(aiIdx, frameworkIdx, 75, "AI tool can generate code for this framework", 0);
        }
      }
      
      for (const backend of backends) {
        const aiIdx = findToolIndex(ai);
        const backendIdx = findToolIndex(backend);
        if (aiIdx !== -1 && backendIdx !== -1 && !compatibilityMap.has(`${Math.min(aiIdx, backendIdx)}-${Math.max(aiIdx, backendIdx)}`)) {
          addCompatibility(aiIdx, backendIdx, 70, "AI tool can help integrate backend services", 0);
        }
      }
    }
    
    // All IDEs should work with deployment platforms
    const ides = ["Cursor", "Windsurf", "Replit", "Codeium", "Tabnine"];
    const deployments = ["Vercel", "Netlify", "Render"];
    
    for (const ide of ides) {
      for (const deploy of deployments) {
        const ideIdx = findToolIndex(ide);
        const deployIdx = findToolIndex(deploy);
        if (ideIdx !== -1 && deployIdx !== -1 && !compatibilityMap.has(`${Math.min(ideIdx, deployIdx)}-${Math.max(ideIdx, deployIdx)}`)) {
          addCompatibility(ideIdx, deployIdx, 80, "IDE can deploy to this platform", 0);
        }
      }
    }
    
    // Convert map to array
    compatibilityMap.forEach(compat => {
      compatibilities.push(compat);
    });

    for (const compatibility of compatibilities) {
      const id = randomUUID();
      this.compatibilities.set(id, { id, ...compatibility });
    }
  }

  // Tool Categories
  async getToolCategories(): Promise<ToolCategory[]> {
    return Array.from(this.toolCategories.values());
  }

  async getToolCategory(id: string): Promise<ToolCategory | undefined> {
    return this.toolCategories.get(id);
  }

  async createToolCategory(category: InsertToolCategory): Promise<ToolCategory> {
    const id = randomUUID();
    const newCategory: ToolCategory = { id, ...category };
    this.toolCategories.set(id, newCategory);
    return newCategory;
  }

  async updateToolCategory(id: string, category: Partial<InsertToolCategory>): Promise<ToolCategory | undefined> {
    const existing = this.toolCategories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...category };
    this.toolCategories.set(id, updated);
    return updated;
  }

  async deleteToolCategory(id: string): Promise<boolean> {
    return this.toolCategories.delete(id);
  }

  // Tools
  async getTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  async getToolsWithCategory(): Promise<ToolWithCategory[]> {
    const tools = Array.from(this.tools.values());
    const result: ToolWithCategory[] = [];
    
    for (const tool of tools) {
      const category = this.toolCategories.get(tool.categoryId);
      if (category) {
        result.push({ ...tool, category });
      }
    }
    
    return result;
  }

  async getToolsWithAllCategories(): Promise<any[]> {
    // For MemStorage, just return tools with single category for now
    const toolsWithCategory = await this.getToolsWithCategory();
    return toolsWithCategory.map(tool => ({
      ...tool,
      categories: tool.category ? [tool.category] : []
    }));
  }

  async getTool(id: string): Promise<Tool | undefined> {
    return this.tools.get(id);
  }

  async getToolWithCategory(id: string): Promise<ToolWithCategory | undefined> {
    const tool = this.tools.get(id);
    if (!tool) return undefined;
    
    const category = this.toolCategories.get(tool.categoryId);
    if (!category) return undefined;
    
    return { ...tool, category };
  }

  async getToolsByCategory(categoryId: string): Promise<Tool[]> {
    return Array.from(this.tools.values()).filter(tool => tool.categoryId === categoryId);
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const id = randomUUID();
    const newTool: Tool = { id, ...tool };
    this.tools.set(id, newTool);
    return newTool;
  }

  async updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined> {
    const existing = this.tools.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...tool };
    this.tools.set(id, updated);
    return updated;
  }

  async deleteTool(id: string): Promise<boolean> {
    return this.tools.delete(id);
  }

  // Compatibilities
  async getCompatibilities(): Promise<Compatibility[]> {
    return Array.from(this.compatibilities.values());
  }

  async getCompatibilityMatrix(): Promise<CompatibilityMatrix[]> {
    const compatibilities = Array.from(this.compatibilities.values());
    const result: CompatibilityMatrix[] = [];
    
    for (const compatibility of compatibilities) {
      const toolOne = await this.getToolWithCategory(compatibility.toolOneId);
      const toolTwo = await this.getToolWithCategory(compatibility.toolTwoId);
      
      if (toolOne && toolTwo) {
        result.push({ toolOne, toolTwo, compatibility });
      }
    }
    
    return result;
  }

  async getCompatibility(toolOneId: string, toolTwoId: string): Promise<Compatibility | undefined> {
    return Array.from(this.compatibilities.values()).find(
      comp => 
        (comp.toolOneId === toolOneId && comp.toolTwoId === toolTwoId) ||
        (comp.toolOneId === toolTwoId && comp.toolTwoId === toolOneId)
    );
  }

  async createCompatibility(compatibility: InsertCompatibility): Promise<Compatibility> {
    const id = randomUUID();
    const newCompatibility: Compatibility = { id, ...compatibility };
    this.compatibilities.set(id, newCompatibility);
    return newCompatibility;
  }

  async updateCompatibility(id: string, compatibility: Partial<InsertCompatibility>): Promise<Compatibility | undefined> {
    const existing = this.compatibilities.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...compatibility };
    this.compatibilities.set(id, updated);
    return updated;
  }

  async deleteCompatibility(id: string): Promise<boolean> {
    return this.compatibilities.delete(id);
  }

  // New StackFast Integration Methods

  async getAlternativeTools(toolId: string): Promise<Tool[]> {
    const tool = this.tools.get(toolId);
    if (!tool) return [];
    
    // Find tools in the same category with high compatibility scores
    const alternatives = Array.from(this.tools.values()).filter(t => 
      t.id !== toolId && t.categoryId === tool.categoryId
    );
    
    // Sort by popularity and maturity scores
    return alternatives.sort((a, b) => 
      (b.popularityScore + b.maturityScore) - (a.popularityScore + a.maturityScore)
    ).slice(0, 5);
  }

  // Stack Templates
  private stackTemplates: Map<string, StackTemplate> = new Map();

  async getStackTemplates(): Promise<StackTemplate[]> {
    // Initialize with predefined templates if empty
    if (this.stackTemplates.size === 0) {
      await this.initializeStackTemplates();
    }
    return Array.from(this.stackTemplates.values());
  }

  async getStackTemplate(id: string): Promise<StackTemplate | undefined> {
    if (this.stackTemplates.size === 0) {
      await this.initializeStackTemplates();
    }
    return this.stackTemplates.get(id);
  }

  async createStackTemplate(template: InsertStackTemplate): Promise<StackTemplate> {
    const id = randomUUID();
    const newTemplate: StackTemplate = { 
      id, 
      ...template,
      createdAt: new Date()
    };
    this.stackTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateStackTemplate(id: string, template: Partial<InsertStackTemplate>): Promise<StackTemplate | undefined> {
    const existing = this.stackTemplates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...template };
    this.stackTemplates.set(id, updated);
    return updated;
  }

  async deleteStackTemplate(id: string): Promise<boolean> {
    return this.stackTemplates.delete(id);
  }

  // Stack Validation & Scoring
  async validateStack(toolIds: string[]): Promise<{
    valid: boolean;
    conflicts: Array<{ toolOne: string; toolTwo: string; reason: string }>;
    dependencies: Array<{ tool: string; requires: string[] }>;
    warnings: string[];
    recommendations: string[];
  }> {
    const conflicts: Array<{ toolOne: string; toolTwo: string; reason: string }> = [];
    const dependencies: Array<{ tool: string; requires: string[] }> = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Check for conflicting tools (e.g., multiple deployment platforms)
    const deploymentTools = toolIds.filter(id => {
      const tool = this.tools.get(id);
      return tool && tool.name && ['Vercel', 'Netlify', 'Render'].includes(tool.name);
    });
    
    if (deploymentTools.length > 1) {
      conflicts.push({
        toolOne: deploymentTools[0],
        toolTwo: deploymentTools[1],
        reason: "Multiple deployment platforms selected - typically only one is needed"
      });
    }

    // Check for missing dependencies
    const hasReact = toolIds.some(id => this.tools.get(id)?.name === 'React');
    const hasNextJs = toolIds.some(id => this.tools.get(id)?.name === 'Next.js');
    
    if (hasNextJs && !hasReact) {
      dependencies.push({
        tool: 'Next.js',
        requires: ['React']
      });
    }

    // Add warnings for incomplete stacks
    const hasFrontend = toolIds.some(id => {
      const tool = this.tools.get(id);
      return tool && tool.categoryId && this.getCategoryName(tool.categoryId) === 'Frontend/Design';
    });
    
    const hasBackend = toolIds.some(id => {
      const tool = this.tools.get(id);
      return tool && tool.categoryId && this.getCategoryName(tool.categoryId) === 'Backend/Database';
    });
    
    if (hasFrontend && !hasBackend) {
      warnings.push("No backend/database selected - consider adding one for data persistence");
    }

    // Add recommendations
    const hasStripe = toolIds.some(id => this.tools.get(id)?.name === 'Stripe');
    if (hasStripe) {
      recommendations.push("Consider adding Plaid for bank account connections");
    }

    return {
      valid: conflicts.length === 0 && dependencies.length === 0,
      conflicts,
      dependencies,
      warnings,
      recommendations
    };
  }

  async calculateHarmonyScore(toolIds: string[]): Promise<number> {
    if (toolIds.length < 2) return 100;
    
    let totalScore = 0;
    let pairCount = 0;
    
    // Calculate average compatibility score for all pairs
    for (let i = 0; i < toolIds.length; i++) {
      for (let j = i + 1; j < toolIds.length; j++) {
        const compatibility = await this.getCompatibility(toolIds[i], toolIds[j]);
        if (compatibility) {
          totalScore += compatibility.compatibilityScore;
          pairCount++;
        } else {
          // No explicit compatibility = neutral score of 50
          totalScore += 50;
          pairCount++;
        }
      }
    }
    
    return pairCount > 0 ? Math.round(totalScore / pairCount) : 50;
  }

  async getStackHarmonyScore(toolIds: string[]): Promise<{ harmonyScore: number; toolIds: string[] }> {
    const harmonyScore = await this.calculateHarmonyScore(toolIds);
    return { harmonyScore, toolIds };
  }

  async getRecommendations(toolIds: string[], category?: string): Promise<Tool[]> {
    const recommendations: Map<string, number> = new Map();
    
    // Get all tools that have high compatibility with the selected tools
    for (const toolId of toolIds) {
      const compatibilities = Array.from(this.compatibilities.values()).filter(
        c => (c.toolOneId === toolId || c.toolTwoId === toolId) && c.compatibilityScore >= 80
      );
      
      for (const comp of compatibilities) {
        const otherToolId = comp.toolOneId === toolId ? comp.toolTwoId : comp.toolOneId;
        if (!toolIds.includes(otherToolId)) {
          const currentScore = recommendations.get(otherToolId) || 0;
          recommendations.set(otherToolId, currentScore + comp.compatibilityScore);
        }
      }
    }
    
    // Filter by category if specified
    let recommendedTools = Array.from(recommendations.entries())
      .map(([id, score]) => ({ tool: this.tools.get(id), score }))
      .filter(item => item.tool !== undefined) as Array<{ tool: Tool; score: number }>;
    
    if (category) {
      const categoryId = Array.from(this.toolCategories.values()).find(c => c.name === category)?.id;
      if (categoryId) {
        recommendedTools = recommendedTools.filter(item => item.tool.categoryId === categoryId);
      }
    }
    
    // Sort by score and return top 5
    return recommendedTools
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.tool);
  }

  async getBulkCompatibility(toolIds: string[]): Promise<Array<{
    toolOneId: string;
    toolTwoId: string;
    score: number;
    notes?: string;
  }>> {
    const results = [];
    
    for (let i = 0; i < toolIds.length; i++) {
      for (let j = i + 1; j < toolIds.length; j++) {
        const compatibility = await this.getCompatibility(toolIds[i], toolIds[j]);
        if (compatibility) {
          results.push({
            toolOneId: toolIds[i],
            toolTwoId: toolIds[j],
            score: compatibility.compatibilityScore,
            notes: compatibility.notes || undefined
          });
        } else {
          results.push({
            toolOneId: toolIds[i],
            toolTwoId: toolIds[j],
            score: 50, // Default neutral score
            notes: "No explicit compatibility data available"
          });
        }
      }
    }
    
    return results;
  }

  // Migration Paths
  private migrationPaths: Map<string, MigrationPath> = new Map();

  async getMigrationPath(fromToolId: string, toToolId: string): Promise<MigrationPath | undefined> {
    // Initialize sample migration paths if empty
    if (this.migrationPaths.size === 0) {
      await this.initializeMigrationPaths();
    }
    
    return Array.from(this.migrationPaths.values()).find(
      path => path.fromToolId === fromToolId && path.toToolId === toToolId
    );
  }

  async createMigrationPath(path: InsertMigrationPath): Promise<MigrationPath> {
    const id = randomUUID();
    const newPath: MigrationPath = { id, ...path };
    this.migrationPaths.set(id, newPath);
    return newPath;
  }

  // Export Functions
  async exportStackAsJSON(toolIds?: string[]): Promise<any> {
    const tools = toolIds 
      ? Array.from(this.tools.values()).filter(t => toolIds.includes(t.id))
      : Array.from(this.tools.values());
    
    const compatibilities = toolIds
      ? Array.from(this.compatibilities.values()).filter(c => 
          toolIds.includes(c.toolOneId) && toolIds.includes(c.toolTwoId))
      : Array.from(this.compatibilities.values());
    
    return {
      tools,
      compatibilities,
      categories: Array.from(this.toolCategories.values()),
      exportDate: new Date().toISOString()
    };
  }

  async exportStackAsCSV(toolIds?: string[]): Promise<string> {
    const matrix = toolIds 
      ? await this.getBulkCompatibility(toolIds)
      : Array.from(this.compatibilities.values()).map(c => ({
          toolOneId: c.toolOneId,
          toolTwoId: c.toolTwoId,
          score: c.compatibilityScore,
          notes: c.notes || ''
        }));
    
    // Create CSV header
    let csv = 'Tool One,Tool Two,Compatibility Score,Notes\n';
    
    // Add rows
    for (const row of matrix) {
      const toolOne = this.tools.get(row.toolOneId);
      const toolTwo = this.tools.get(row.toolTwoId);
      if (toolOne && toolTwo) {
        csv += `"${toolOne.name}","${toolTwo.name}",${row.score},"${row.notes || ''}"\n`;
      }
    }
    
    return csv;
  }

  // Helper methods
  private getCategoryName(categoryId: string): string {
    return this.toolCategories.get(categoryId)?.name || '';
  }

  private async initializeStackTemplates() {
    // Get tool IDs by name for template creation
    const getToolIdByName = (name: string) => {
      return Array.from(this.tools.values()).find(t => t.name === name)?.id;
    };

    const templates = [
      {
        name: "AI-Powered SaaS Starter",
        description: "Complete stack for building AI-powered SaaS applications",
        category: "AI-Powered SaaS",
        toolIds: [
          getToolIdByName("Cursor"),
          getToolIdByName("Next.js"),
          getToolIdByName("Supabase"),
          getToolIdByName("Stripe"),
          getToolIdByName("Vercel")
        ].filter(id => id !== undefined) as string[],
        useCase: "Building subscription-based AI applications with authentication and payments",
        setupComplexity: "medium",
        estimatedCost: "$50-100/month",
        pros: ["Excellent AI integration", "Built-in auth & payments", "Scalable infrastructure"],
        cons: ["Learning curve for beginners", "Monthly costs add up"],
        harmonyScore: 95,
        popularityRank: 1
      },
      {
        name: "Rapid Prototyping Stack",
        description: "Fast development environment for MVPs and prototypes",
        category: "Rapid Prototyping",
        toolIds: [
          getToolIdByName("Replit"),
          getToolIdByName("React"),
          getToolIdByName("Firebase"),
          getToolIdByName("Netlify")
        ].filter(id => id !== undefined) as string[],
        useCase: "Quick proof-of-concepts and hackathon projects",
        setupComplexity: "easy",
        estimatedCost: "$0-20/month",
        pros: ["Zero config setup", "Free tier available", "Fast iteration"],
        cons: ["Limited customization", "Not ideal for production"],
        harmonyScore: 88,
        popularityRank: 2
      },
      {
        name: "Enterprise AI Platform",
        description: "Robust stack for enterprise-grade AI applications",
        category: "Enterprise",
        toolIds: [
          getToolIdByName("GitHub Copilot"),
          getToolIdByName("React"),
          getToolIdByName("Supabase"),
          getToolIdByName("Stripe"),
          getToolIdByName("Vercel")
        ].filter(id => id !== undefined) as string[],
        useCase: "Large-scale applications with enterprise requirements",
        setupComplexity: "hard",
        estimatedCost: "$200-500/month",
        pros: ["Enterprise support", "High scalability", "Security features"],
        cons: ["Complex setup", "Higher costs", "Requires expertise"],
        harmonyScore: 92,
        popularityRank: 3
      }
    ];

    for (const template of templates) {
      await this.createStackTemplate(template);
    }
  }

  private async initializeMigrationPaths() {
    // Get tool IDs by name
    const getToolIdByName = (name: string) => {
      return Array.from(this.tools.values()).find(t => t.name === name)?.id;
    };

    const firebaseId = getToolIdByName("Firebase");
    const supabaseId = getToolIdByName("Supabase");
    const netlifyId = getToolIdByName("Netlify");
    const vercelId = getToolIdByName("Vercel");

    const paths = [
      {
        fromToolId: firebaseId,
        toToolId: supabaseId,
        difficulty: "medium",
        estimatedTime: "1-2 weeks",
        steps: [
          "Export data from Firebase",
          "Set up Supabase project",
          "Migrate authentication users",
          "Update database queries",
          "Test all functionality"
        ],
        considerations: ["Different query syntax", "Auth migration complexity", "Real-time features differ"],
        dataPortability: 85
      },
      {
        fromToolId: netlifyId,
        toToolId: vercelId,
        difficulty: "easy",
        estimatedTime: "1-2 days",
        steps: [
          "Export environment variables",
          "Connect GitHub repo to Vercel",
          "Configure build settings",
          "Update DNS settings",
          "Test deployment"
        ],
        considerations: ["Similar deployment process", "May need build config adjustments"],
        dataPortability: 95
      }
    ];

    for (const path of paths) {
      if (path.fromToolId && path.toToolId) {
        await this.createMigrationPath(path as InsertMigrationPath);
      }
    }
  }

  async clearAllTools(): Promise<void> {
    this.compatibilities.clear();
    this.tools.clear();
    this.toolCategories.clear();
    this.seedData(); // Re-seed categories
  }

  async clearAllCompatibilities(): Promise<void> {
    this.compatibilities.clear();
  }

  async importToolsFromCSV(): Promise<number> {
    // Simple mock implementation for MemStorage
    // In real implementation, would parse CSV and import tools
    return 0;
  }

  async generateCompatibilityScores(): Promise<{ generated: number; updated: number }> {
    // Simple mock implementation for MemStorage
    return { generated: 0, updated: 0 };
  }

  async exportToolsAsCSV(): Promise<string> {
    const header = [
      "id","name","description","category","url","frameworks","languages","features","integrations","maturityScore","popularityScore","pricing","notes"
    ].join(",") + "\n";
    const all = Array.from(this.tools.values());
    if (all.length === 0) {
      return header; // template only
    }
    const categoryName = (id: string) => this.toolCategories.get(id)?.name || "";
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const row = (t: Tool) => [
      t.id,
      t.name,
      t.description || "",
      categoryName(t.categoryId),
      t.url || "",
      (t.frameworks || []).join(";"),
      (t.languages || []).join(";"),
      (t.features || []).join(";"),
      (t.integrations || []).join(";"),
      t.maturityScore ?? 0,
      t.popularityScore ?? 0,
      t.pricing || "",
      t.notes || "",
    ].map(esc).join(",");
    return header + all.map(row).join("\n") + "\n";
  }
}



// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize database optimizations
    this.initializeOptimizations();
  }

  private async initializeOptimizations() {
    try {
      await DatabaseOptimizer.applyIndexes();
      console.log('Database indexes applied successfully');
    } catch (error) {
      console.error('Failed to apply database indexes:', error);
    }
  }

  // Copy seed data method from MemStorage  
  async seedDatabase(): Promise<{ categories: number; tools: number; compatibilities: number }> {
    // Create a temporary MemStorage instance to get seed data
    const tempMemStorage = new MemStorage();
    
    // Get all seeded data from MemStorage
    const categories = await tempMemStorage.getToolCategories();
    const tools = await tempMemStorage.getTools();
    const compatibilities = await tempMemStorage.getCompatibilities();
    
    let categoriesAdded = 0;
    let toolsAdded = 0;
    let compatibilitiesAdded = 0;
    
    // Clear existing data first
    await db.delete(compatibilitiesTable);
    await db.delete(toolsTable);
    await db.delete(toolCategoriesTable);
    
    // Insert categories
    for (const category of categories) {
      await db.insert(toolCategoriesTable).values(category);
      categoriesAdded++;
    }
    
    // Insert tools
    for (const tool of tools) {
      await db.insert(toolsTable).values(tool);
      toolsAdded++;
    }
    
    // Insert compatibilities
    for (const compatibility of compatibilities) {
      await db.insert(compatibilitiesTable).values(compatibility);
      compatibilitiesAdded++;
    }
    
    return {
      categories: categoriesAdded,
      tools: toolsAdded,
      compatibilities: compatibilitiesAdded
    };
  }
  
  // Database query monitoring wrapper
  private async monitoredQuery<T>(queryName: string, queryFn: () => Promise<T>, requestId?: string): Promise<T> {
    return DatabaseQueryMonitor.trackQuery(queryName, queryFn, requestId);
  }

  async getToolCategories(): Promise<ToolCategory[]> {
    return this.monitoredQuery(
      'getToolCategories',
      () => db.select().from(toolCategoriesTable)
    );
  }

  async getToolCategory(id: string): Promise<ToolCategory | undefined> {
    const [category] = await db.select().from(toolCategoriesTable).where(eq(toolCategoriesTable.id, id));
    return category;
  }

  async createToolCategory(data: InsertToolCategory): Promise<ToolCategory> {
    const [category] = await db.insert(toolCategoriesTable).values(data).returning();
    return category;
  }

  async updateToolCategory(id: string, data: Partial<InsertToolCategory>): Promise<ToolCategory | undefined> {
    const [updated] = await db.update(toolCategoriesTable).set(data).where(eq(toolCategoriesTable.id, id)).returning();
    return updated;
  }

  async deleteToolCategory(id: string): Promise<boolean> {
    const result = await db.delete(toolCategoriesTable).where(eq(toolCategoriesTable.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTools(): Promise<Tool[]> {
    return db.select().from(toolsTable);
  }

  async getTool(id: string): Promise<Tool | undefined> {
    return this.monitoredQuery(
      'getTool',
      async () => {
        const [tool] = await db.select().from(toolsTable).where(eq(toolsTable.id, id));
        return tool;
      }
    );
  }

  async getToolByName(name: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(toolsTable).where(eq(toolsTable.name, name));
    return tool;
  }

  async getToolsWithCategory(): Promise<any[]> {
    return this.monitoredQuery(
      'getToolsWithCategory',
      async () => {
        const tools = await db.select({
          tool: toolsTable,
          category: toolCategoriesTable
        })
        .from(toolsTable)
        .leftJoin(toolCategoriesTable, eq(toolsTable.categoryId, toolCategoriesTable.id));
        
        return tools.map(({ tool, category }) => ({
          ...tool,
          category
        }));
      }
    );
  }

  async getToolsWithAllCategories(): Promise<any[]> {
    // Get all tools with their primary category
    const toolsWithPrimary = await this.getToolsWithCategory();
    
    // Get all junction records with categories
    const junctions = await db.select({
      toolId: toolCategoryJunction.toolId,
      category: toolCategoriesTable
    })
    .from(toolCategoryJunction)
    .innerJoin(toolCategoriesTable, eq(toolCategoryJunction.categoryId, toolCategoriesTable.id));
    
    // Group categories by tool ID
    const categoriesByTool = new Map<string, ToolCategory[]>();
    junctions.forEach(({ toolId, category }) => {
      if (!categoriesByTool.has(toolId)) {
        categoriesByTool.set(toolId, []);
      }
      categoriesByTool.get(toolId)!.push(category);
    });
    
    // Add all categories to each tool
    return toolsWithPrimary.map(tool => ({
      ...tool,
      categories: categoriesByTool.get(tool.id) || [tool.category].filter(Boolean)
    }));
  }

  async getToolWithCategory(id: string): Promise<any | undefined> {
    const [result] = await db.select({
      tool: toolsTable,
      category: toolCategoriesTable
    })
    .from(toolsTable)
    .leftJoin(toolCategoriesTable, eq(toolsTable.categoryId, toolCategoriesTable.id))
    .where(eq(toolsTable.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.tool,
      category: result.category
    };
  }

  async createTool(data: InsertTool): Promise<Tool> {
    const [tool] = await db.insert(toolsTable).values(data).returning();
    return tool;
  }

  async updateTool(id: string, data: Partial<InsertTool>): Promise<Tool | undefined> {
    const [updated] = await db.update(toolsTable).set(data).where(eq(toolsTable.id, id)).returning();
    return updated;
  }

  async deleteTool(id: string): Promise<boolean> {
    const result = await db.delete(toolsTable).where(eq(toolsTable.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getToolsByCategory(categoryId: string): Promise<Tool[]> {
    return db.select().from(toolsTable).where(eq(toolsTable.categoryId, categoryId));
  }

  async getAlternativeTools(toolId: string): Promise<Tool[]> {
    const tool = await this.getTool(toolId);
    if (!tool) return [];
    return db.select().from(toolsTable).where(eq(toolsTable.categoryId, tool.categoryId)).limit(5);
  }

  // Keep a single implementation of getToolsByIds
  async getToolsByIds(toolIds: string[]): Promise<Tool[]> {
    if (toolIds.length === 0) return [];
    // Use optimized query with inArray for better performance
    return await DatabaseOptimizer.getToolsByIdsOptimized(toolIds);
  }

  // Keep a single implementation of getCompatibilitiesByToolId
  async getCompatibilitiesByToolId(toolId: string): Promise<Compatibility[]> {
    const compatibilities = await db.select().from(compatibilitiesTable).where(
      sql`${compatibilitiesTable.toolOneId} = ${toolId} OR ${compatibilitiesTable.toolTwoId} = ${toolId}`
    );
    return compatibilities;
  }

  async getCompatibilities(): Promise<Compatibility[]> {
    return db.select().from(compatibilitiesTable);
  }

  async getCompatibility(toolOneId: string, toolTwoId: string): Promise<Compatibility | undefined> {
    const [compatibility] = await db.select()
      .from(compatibilitiesTable)
      .where(
        and(
          eq(compatibilitiesTable.toolOneId, toolOneId),
          eq(compatibilitiesTable.toolTwoId, toolTwoId)
        )
      );
    
    if (compatibility) return compatibility;
    
    // Check reverse order
    const [reverseCompatibility] = await db.select()
      .from(compatibilitiesTable)
      .where(
        and(
          eq(compatibilitiesTable.toolOneId, toolTwoId),
          eq(compatibilitiesTable.toolTwoId, toolOneId)
        )
      );
    
    return reverseCompatibility;
  }

  async getCompatibilityMatrix(): Promise<any[]> {
    return this.monitoredQuery(
      'getCompatibilityMatrix',
      async () => {
        // Use optimized compatibility matrix query to avoid N+1 queries
        return await DatabaseOptimizer.getCompatibilityMatrixOptimized();
      }
    );
  }

  async createCompatibility(data: InsertCompatibility): Promise<Compatibility> {
    const [compatibility] = await db.insert(compatibilitiesTable).values(data).returning();
    return compatibility;
  }

  async updateCompatibility(id: string, data: Partial<InsertCompatibility>): Promise<Compatibility | undefined> {
    const [updated] = await db.update(compatibilitiesTable)
      .set(data)
      .where(eq(compatibilitiesTable.id, id))
      .returning();
    return updated;
  }

  async deleteCompatibilityById(id: string): Promise<boolean> {
    const result = await db.delete(compatibilitiesTable).where(eq(compatibilitiesTable.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Stack Templates
  async getStackTemplates(): Promise<StackTemplate[]> {
    // Mock implementation for now - would need stackTemplates table
    return [];
  }

  async getStackTemplate(id: string): Promise<StackTemplate | undefined> {
    // Mock implementation for now
    return undefined;
  }

  async createStackTemplate(template: InsertStackTemplate): Promise<StackTemplate> {
    // Mock implementation for now - would need stackTemplates table
    const stackTemplate: StackTemplate = {
      id: randomUUID(),
      ...template
    };
    return stackTemplate;
  }

  async updateStackTemplate(id: string, template: Partial<InsertStackTemplate>): Promise<StackTemplate | undefined> {
    // Mock implementation for now
    return undefined;
  }

  async deleteStackTemplate(id: string): Promise<boolean> {
    // Mock implementation for now
    return false;
  }

  // Stack Validation & Scoring
  async validateStack(toolIds: string[]): Promise<{
    valid: boolean;
    conflicts: Array<{ toolOne: string; toolTwo: string; reason: string }>;
    dependencies: Array<{ tool: string; requires: string[] }>;
    warnings: string[];
    recommendations: string[];
  }> {
    const compatibilities = await this.getBulkCompatibility(toolIds);
    
    const conflicts = compatibilities
      .filter(c => c.score < 30)
      .map(c => ({
        toolOne: c.toolOneId,
        toolTwo: c.toolTwoId,
        reason: c.notes || "Low compatibility score"
      }));
    
    return {
      valid: conflicts.length === 0,
      conflicts,
      dependencies: [], // Would need more complex logic
      warnings: conflicts.length > 0 ? ["Some tools have low compatibility scores"] : [],
      recommendations: []
    };
  }

  async deleteCompatibilityPair(toolOneId: string, toolTwoId: string): Promise<boolean> {
    const result = await db.delete(compatibilitiesTable)
      .where(
        and(
          eq(compatibilitiesTable.toolOneId, toolOneId),
          eq(compatibilitiesTable.toolTwoId, toolTwoId)
        )
      );
    return result.rowCount > 0;
  }

  // Remove duplicated alternate versions of these methods

  async searchTools(query: string): Promise<Tool[]> {
    return db.select()
      .from(toolsTable)
      .where(
        sql`${toolsTable.name} ILIKE ${'%' + query + '%'} OR ${toolsTable.description} ILIKE ${'%' + query + '%'}`
      );
  }

  async analyzeStackCompatibility(toolIds: string[]): Promise<any> {
    const tools = await this.getToolsByIds(toolIds);
    const compatibilities = [];
    
    for (let i = 0; i < toolIds.length; i++) {
      for (let j = i + 1; j < toolIds.length; j++) {
        const comp = await this.getCompatibility(toolIds[i], toolIds[j]);
        if (comp) {
          compatibilities.push(comp);
        }
      }
    }
    
    const avgScore = compatibilities.length > 0
      ? compatibilities.reduce((sum, c) => sum + c.compatibilityScore, 0) / compatibilities.length
      : 50;
    
    return {
      tools,
      compatibilities,
      overallScore: Math.round(avgScore),
      strengths: compatibilities.filter(c => c.compatibilityScore >= 80).map(c => c.notes),
      weaknesses: compatibilities.filter(c => c.compatibilityScore < 60).map(c => c.notes)
    };
  }

  async calculateHarmonyScore(toolIds: string[]): Promise<number> {
    if (toolIds.length < 2) return 100;
    
    let totalScore = 0;
    let pairCount = 0;
    
    for (let i = 0; i < toolIds.length; i++) {
      for (let j = i + 1; j < toolIds.length; j++) {
        const compatibility = await this.getCompatibility(toolIds[i], toolIds[j]);
        if (compatibility) {
          totalScore += compatibility.compatibilityScore;
          pairCount++;
        } else {
          totalScore += 50; // Default neutral score
          pairCount++;
        }
      }
    }
    
    return pairCount > 0 ? Math.round(totalScore / pairCount) : 50;
  }

  async getStackHarmonyScore(toolIds: string[]): Promise<{ harmonyScore: number; toolIds: string[] }> {
    const harmonyScore = await this.calculateHarmonyScore(toolIds);
    return { harmonyScore, toolIds };
  }

  async getRecommendations(toolIds: string[], category?: string): Promise<Tool[]> {
    const recommendations: Map<string, number> = new Map();
    
    for (const toolId of toolIds) {
      const compatibilities = await this.getCompatibilitiesByToolId(toolId);
      
      for (const comp of compatibilities) {
        const otherToolId = comp.toolOneId === toolId ? comp.toolTwoId : comp.toolOneId;
        if (!toolIds.includes(otherToolId) && comp.compatibilityScore >= 80) {
          const currentScore = recommendations.get(otherToolId) || 0;
          recommendations.set(otherToolId, currentScore + comp.compatibilityScore);
        }
      }
    }
    
    let recommendedToolIds = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);
    
    if (recommendedToolIds.length === 0) return [];
    
    let tools = await this.getToolsByIds(recommendedToolIds);
    
    if (category) {
      const categoryData = await db.select().from(toolCategoriesTable).where(eq(toolCategoriesTable.name, category));
      if (categoryData.length > 0) {
        tools = tools.filter(t => t.categoryId === categoryData[0].id);
      }
    }
    
    return tools; // Return all 71 tools
  }

  async getBulkCompatibility(toolIds: string[]): Promise<Array<{
    toolOneId: string;
    toolTwoId: string;
    score: number;
    notes?: string;
  }>> {
    // Use optimized bulk compatibility query to avoid N+1 queries
    return await DatabaseOptimizer.getBulkCompatibilityOptimized(toolIds);
  }

  async getMigrationPath(fromToolId: string, toToolId: string): Promise<MigrationPath | undefined> {
    const [path] = await db.select()
      .from(migrationPathsTable)
      .where(
        and(
          eq(migrationPathsTable.fromToolId, fromToolId),
          eq(migrationPathsTable.toToolId, toToolId)
        )
      );
    return path;
  }

  async createMigrationPath(path: InsertMigrationPath): Promise<MigrationPath> {
    const [created] = await db.insert(migrationPathsTable).values(path).returning();
    return created;
  }

  async exportStackAsJSON(toolIds?: string[]): Promise<any> {
    const tools = toolIds ? await this.getToolsByIds(toolIds) : await this.getTools();
    const categories = await this.getToolCategories();
    
    let compatibilities = [];
    if (toolIds) {
      compatibilities = await this.getBulkCompatibility(toolIds);
    } else {
      compatibilities = await this.getCompatibilities();
    }
    
    return {
      tools,
      compatibilities,
      categories,
      exportDate: new Date().toISOString()
    };
  }

  async exportStackAsCSV(toolIds?: string[]): Promise<string> {
    const tools = toolIds ? await this.getToolsByIds(toolIds) : await this.getTools();
    const toolsMap = new Map(tools.map(t => [t.id, t]));
    
    const matrix = toolIds
      ? await this.getBulkCompatibility(toolIds)
      : (await this.getCompatibilities()).map(c => ({
          toolOneId: c.toolOneId,
          toolTwoId: c.toolTwoId,
          score: c.compatibilityScore,
          notes: c.notes || ''
        }));
    
    let csv = 'Tool One,Tool Two,Compatibility Score,Notes\n';
    
    for (const row of matrix) {
      const toolOne = toolsMap.get(row.toolOneId);
      const toolTwo = toolsMap.get(row.toolTwoId);
      if (toolOne && toolTwo) {
        csv += `"${toolOne.name}","${toolTwo.name}",${row.score},"${row.notes || ''}"\n`;
      }
    }
    
    return csv;
  }

  async clearAllTools(): Promise<void> {
    // Delete all compatibilities first (foreign key constraints)
    await db.delete(compatibilitiesTable);
    
    // Delete all tools
    await db.delete(toolsTable);
    
    // Delete all categories  
    await db.delete(toolCategoriesTable);
  }

  async clearAllCompatibilities(): Promise<void> {
    await db.delete(compatibilitiesTable);
  }

  async importToolsFromCSV(): Promise<number> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Read CSV file
      const csvPath = path.resolve('attached_assets/Coding tool profile database setup_1754841204572.csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      
      // Parse CSV
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      // Fetch existing categories from database
      const existingCategories = await this.getToolCategories();
      const categoryMap = new Map<string, string>();
      
      for (const category of existingCategories) {
        categoryMap.set(category.name, category.id);
      }

      let importedCount = 0;

      // Parse each tool from CSV (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < 3) continue;
        
        // CSV columns: Name,Categories,Description,URL,Frameworks,Features,Native Integrations,Verified Integrations,Notable Strengths,Known Limitations,Maturity Score,Popularity Score,Pricing
        const [name, categoriesStr, description, url, frameworks, features, nativeIntegrations, verifiedIntegrations, notableStrengths, knownLimitations, maturityScoreStr, popularityScoreStr, pricing] = values;
        
        if (!name || !description) continue;
        
        // Parse scores, handling "Not specified" and empty values
        const parseScore = (scoreStr: string): number => {
          if (!scoreStr || scoreStr.toLowerCase().includes('not specified') || scoreStr.trim() === '') {
            return 7.0; // Default score for unspecified
          }
          const parsed = parseFloat(scoreStr);
          return isNaN(parsed) ? 7.0 : parsed;
        };
        
        const maturityScore = parseScore(maturityScoreStr);
        const popularityScore = parseScore(popularityScoreStr);
        const finalPricing = pricing && pricing.toLowerCase() !== 'not specified' && pricing.trim() !== '' ? 
          pricing.replace(/"/g, '') : "Pricing not specified";

        // Map CSV categories to our category IDs with improved matching
        const categories = categoriesStr.split(',').map(c => c.trim());
        let categoryId = categoryMap.get("AI Coding Tools"); // Default fallback
        
        // Try to find the best matching category
        for (const [dbCategoryName, dbCategoryId] of categoryMap.entries()) {
          const dbNameLower = dbCategoryName.toLowerCase();
          
          // Check if any CSV category matches this database category
          for (const csvCategory of categories) {
            const csvLower = csvCategory.toLowerCase();
            
            if (
              (dbNameLower.includes("frontend") && csvLower.includes("design")) ||
              (dbNameLower.includes("frontend") && csvLower.includes("frontend")) ||
              (dbNameLower.includes("backend") && csvLower.includes("backend")) ||
              (dbNameLower.includes("backend") && csvLower.includes("database")) ||
              (dbNameLower.includes("ide") && csvLower.includes("ide")) ||
              (dbNameLower.includes("payment") && csvLower.includes("payment")) ||
              (dbNameLower.includes("devops") && csvLower.includes("deployment")) ||
              (dbNameLower.includes("ai") && csvLower.includes("coding"))
            ) {
              categoryId = dbCategoryId;
              break;
            }
          }
          
          if (categoryId !== categoryMap.get("AI Coding Tools")) break;
        }
        
        // Additional manual mapping for specific tools
        if (name.toLowerCase().includes("payment") || name.toLowerCase().includes("stripe")) {
          categoryId = categoryMap.get("Payment Platforms") || categoryId;
        } else if (name.toLowerCase().includes("supabase") || name.toLowerCase().includes("firebase")) {
          categoryId = categoryMap.get("Backend/Database") || categoryId;
        }
        
        // Ensure we have a valid category ID
        if (!categoryId) {
          categoryId = categoryMap.get("AI Coding Tools") || Array.from(categoryMap.values())[0];
        }

        // Create tool with real CSV data
        const tool: InsertTool = {
          id: randomUUID(),
          name: name.replace(/"/g, ''),
          description: description.replace(/"/g, ''),
          categoryId: categoryId || categoryMap.get("AI Coding Tools")!,
          url: url?.replace(/"/g, '') || null,
          frameworks: frameworks ? frameworks.replace(/"/g, '').split(',').map(f => f.trim()).filter(f => f) : [],
          languages: [], // Will be populated later if needed
          features: features ? features.replace(/"/g, '').split(',').map(f => f.trim()).filter(f => f) : [],
          integrations: nativeIntegrations ? nativeIntegrations.replace(/"/g, '').split(',').map(i => i.trim()).filter(i => i) : [],
          maturityScore,
          popularityScore,
          pricing: finalPricing,
          notes: `Imported from curated CSV data${notableStrengths ? `. Strengths: ${notableStrengths.replace(/"/g, '')}` : ''}`
        };

        await this.createTool(tool);
        importedCount++;
      }

      return importedCount;
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw error;
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  async generateCompatibilityScores(): Promise<{ generated: number; updated: number }> {
    const { CompatibilityEngine } = await import('./services/compatibility-engine');
    const engine = new CompatibilityEngine();
    
    let generated = 0;
    let updated = 0;
    
    try {
      // Get all tools
      const tools = await this.getTools();
      console.log(`Generating compatibility scores for ${tools.length} tools...`);
      
      // Generate compatibility for all tool pairs
      for (let i = 0; i < tools.length; i++) {
        for (let j = i + 1; j < tools.length; j++) {
          const toolA = tools[i];
          const toolB = tools[j];
          
          // Calculate compatibility using the engine
          const result = engine.calculateCompatibility(toolA, toolB);
          
          // Check if compatibility already exists
          const existing = await this.getCompatibility(toolA.id, toolB.id);
          
          if (existing) {
            // Update existing compatibility
            await db.update(compatibilitiesTable)
              .set({
                compatibilityScore: result.compatibilityScore,
                notes: result.notes,
                verifiedIntegration: result.verifiedIntegration,
                integrationDifficulty: result.integrationDifficulty,
                setupSteps: result.setupSteps,
                dependencies: result.dependencies
              })
              .where(eq(compatibilitiesTable.id, existing.id));
            updated++;
          } else {
            // Create new compatibility record
            await db.insert(compatibilitiesTable).values({
              id: randomUUID(),
              toolOneId: result.toolOneId,
              toolTwoId: result.toolTwoId,
              compatibilityScore: result.compatibilityScore,
              notes: result.notes,
              verifiedIntegration: result.verifiedIntegration,
              integrationDifficulty: result.integrationDifficulty,
              setupSteps: result.setupSteps,
              dependencies: result.dependencies
            });
            generated++;
          }
        }
      }
      
      console.log(`Compatibility generation complete. Generated: ${generated}, Updated: ${updated}`);
      return { generated, updated };
      
    } catch (error) {
      console.error('Error generating compatibility scores:', error);
      throw error;
    }
  }

  async exportToolsAsCSV(): Promise<string> {
    const all = await this.getToolsWithCategory();
    const header = [
      "id","name","description","category","url","frameworks","languages","features","integrations","maturityScore","popularityScore","pricing","notes"
    ].join(",") + "\n";
    if (all.length === 0) {
      return header; // template only
    }
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const row = (t: any) => [
      t.id,
      t.name,
      t.description || "",
      t.category?.name || "",
      t.url || "",
      (t.frameworks || []).join(";"),
      (t.languages || []).join(";"),
      (t.features || []).join(";"),
      (t.integrations || []).join(";"),
      t.maturityScore ?? 0,
      t.popularityScore ?? 0,
      t.pricing || "",
      t.notes || "",
    ].map(esc).join(",");
    return header + all.map(row).join("\n") + "\n";
  }
}

// Use database storage instead of memory storage
// Use database storage when DATABASE_URL is configured; otherwise fall back to in-memory storage.
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
