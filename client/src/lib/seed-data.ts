import type { InsertToolCategory, InsertTool, InsertCompatibility } from "@shared/schema";

// Tool Categories based on the PDF classification
export const seedCategories: InsertToolCategory[] = [
  {
    name: "AI Coding Tools",
    description: "AI-powered development assistants and code generation platforms",
    color: "#FF4500"
  },
  {
    name: "Frontend/Design",
    description: "Frontend frameworks, design tools, and UI libraries",
    color: "#1F6FEB"
  },
  {
    name: "Backend/Database", 
    description: "Backend services, databases, and server infrastructure",
    color: "#238636"
  },
  {
    name: "Payment Platforms",
    description: "Payment processing and financial service integrations",
    color: "#FB8500"
  },
  {
    name: "DevOps/Deployment",
    description: "Development operations, deployment, and hosting platforms",
    color: "#8B5CF6"
  }
];

// Comprehensive tool data extracted from the PDF
export const seedTools: Omit<InsertTool, "categoryId">[] = [
  // AI Coding Tools
  {
    name: "Lovable",
    description: "AI-powered platform that enables users of any skill level to create full-stack web applications through natural language. Simply describe what you want, and Lovable generates a working app for you.",
    url: "https://lovable.dev",
    frameworks: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    languages: ["JavaScript", "TypeScript"],
    features: [
      "Prompt-based app builder with end-to-end generation",
      "Authentication, database (Postgres via Supabase), file storage",
      "Real-time analytics out-of-the-box",
      "Library of templates for dashboards, e-commerce",
      "Collaborative web IDE for debugging and editing",
      "Code export capability"
    ],
    integrations: ["Supabase", "GitHub", "OpenAI", "Anthropic", "Stripe", "Resend", "Clerk", "Three.js", "D3.js", "Highcharts", "p5.js", "Twilio", "n8n", "Make"],
    maturityScore: 8.3,
    popularityScore: 8.9,
    pricing: "Free tier (5 AI messages/day), Pro at $25/mo, Enterprise custom pricing",
    notes: "Great for rapid prototyping – one founder built 30 apps in 30 days. Handles both frontend and backend generation with real-time GitHub syncing."
  },
  {
    name: "Bolt (StackBlitz)",
    description: "AI-powered full-stack web development agent by StackBlitz that turns text prompts into working web applications in your browser via WebContainers.",
    url: "https://bolt.new",
    frameworks: ["Next.js", "React", "Tailwind CSS", "Astro", "Svelte", "Vue", "Remix", "Vite"],
    languages: ["JavaScript", "TypeScript"],
    features: [
      "Chat-based code generation with image upload support",
      "WebContainers (Node.js in-browser) runtime",
      "Diff view feature showing code changes",
      "Manual code editing in online IDE",
      "NPM package installation support",
      "Built-in error detection and AI fixes",
      "One-click Netlify deployment"
    ],
    integrations: ["Netlify", "GitHub", "VS Code", "Anthropic Claude", "OpenAI GPT-4", "Supabase", "MongoDB"],
    maturityScore: 8.0,
    popularityScore: 8.5,
    pricing: "Free tier (~100K tokens/day), Pro at $20/mo, Enterprise up to $100+/mo",
    notes: "In-browser dev environment with very fast iteration speed. Unique AI fix capability when apps throw errors."
  },
  {
    name: "Vercel v0",
    description: "Vercel's generative UI/tooling platform that builds full-stack web applications from natural language prompts, optimized for Next.js and Vercel infrastructure.",
    url: "https://v0.dev",
    frameworks: ["Next.js", "React", "Tailwind CSS"],
    languages: ["JavaScript", "TypeScript"],
    features: [
      "Text-to-UI generation with real-time preview",
      "Multi-step prompts for iterative refinement",
      "Figma design and image mockup integration",
      "One-click Vercel deployment",
      "shadcn/ui component library integration",
      "Serverless functions support"
    ],
    integrations: ["Vercel", "Figma", "Supabase", "NextAuth", "Prisma", "AI SDK"],
    maturityScore: 7.5,
    popularityScore: 8.0,
    pricing: "Free tier, Premium at $20/mo, Ultra at $50/mo",
    notes: "Built by Vercel with best practices for Next.js. Supports UI sketches and images as input for layout generation."
  },
  {
    name: "Tempo Labs",
    description: "Visual AI IDE that helps teams collaboratively build web applications with AI assistance, bridging designers, product managers, and developers through visual editing.",
    url: "https://tempo.new",
    frameworks: ["React", "Next.js"],
    languages: ["JavaScript", "TypeScript", "Python", "SQL"],
    features: [
      "Product Requirement to app generation",
      "Visual Editor with drag-and-drop UI elements",
      "AI Chat Discuss Mode for logic implementation",
      "Full-stack generation (frontend, backend, CI/CD)",
      "Team collaboration with real-time syncing",
      "One-click deployment capability"
    ],
    integrations: ["Supabase", "GitHub", "Google Maps API", "Figma", "Vercel", "AWS"],
    maturityScore: 7.0,
    popularityScore: 7.5,
    pricing: "Free tier during beta, Pro plan ~$30/mo expected, Enterprise tier planned",
    notes: "Visual + AI hybrid approach with fine-grained control. Y Combinator backed with focus on complete app generation including test data."
  },
  {
    name: "Base44",
    description: "No-code AI app builder that turns text descriptions into fully functional web applications with built-in database, authentication, and hosting infrastructure.",
    url: "https://base44.com",
    frameworks: ["Next.js", "React", "Tailwind CSS"],
    languages: ["JavaScript", "TypeScript", "SQL"],
    features: [
      "Full-stack text-to-app generation",
      "Built-in SQL database and auth system",
      "Live code editor with AI Builder Chat",
      "Inline diff viewing for AI changes",
      "Built-in hosting & deployment",
      "Add-on library for AI features (chatbots, text completion)"
    ],
    integrations: ["Stripe", "Twilio", "SendGrid", "OpenAI", "Anthropic"],
    maturityScore: 8.0,
    popularityScore: 8.2,
    pricing: "Free: 25 AI messages/month, Starter $20/mo, Builder $50/mo, Pro $100/mo, Elite $200/mo",
    notes: "Complete solution with everything built-in. Provides more out-of-the-box than competitors with internal database and auth."
  },
  {
    name: "Softgen",
    description: "AI-powered platform for rapidly building web apps without coding, with educational focus providing pseudocode translations for learning purposes.",
    url: "https://softgen.ai",
    frameworks: ["Next.js", "React"],
    languages: ["JavaScript", "TypeScript"],
    features: [
      "AI code generation with preview environment",
      "Iterative workflow with feedback integration",
      "Pseudocode translation for educational purposes",
      "Integrated user auth and database",
      "One-click deployment capability"
    ],
    integrations: ["Google Maps API", "Stripe", "Twilio", "SendGrid", "OpenAI", "Vercel"],
    maturityScore: 7.0,
    popularityScore: 7.0,
    pricing: "Free trial, Personal ~$20-30/mo, Business higher tiers",
    notes: "Emphasizes education by providing pseudocode explanations. Great for learning while building applications."
  },
  {
    name: "WebSparks",
    description: "AI-powered platform that enables developers, designers, and non-coders to create production-grade websites from prompts or sketches with multimodal input support.",
    url: "https://websparks.ai", 
    frameworks: ["React", "Next.js", "Angular", "Vue"],
    languages: ["JavaScript", "TypeScript", "HTML", "CSS", "Python"],
    features: [
      "Multimodal input (text, images, wireframes)",
      "Conversational AI agent for real-time editing",
      "Full-stack generation with database connectivity",
      "Component library integration",
      "Instant deployment with SEO optimization"
    ],
    integrations: ["Vercel", "Mailchimp", "Stripe", "Shopify", "Codeium", "B12.io"],
    maturityScore: 7.8,
    popularityScore: 7.2,
    pricing: "Free hosting tier, Pro plans starting ~$25/mo",
    notes: "Versatile input methods including sketch-to-code. Production-ready output with clean, deployable code."
  },
  {
    name: "ChatGPT",
    description: "Advanced AI language model by OpenAI with unified reasoning system, multimodal capabilities, and extensive code generation abilities across all major programming languages.",
    url: "https://chat.openai.com",
    frameworks: ["All major frameworks"],
    languages: ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin"],
    features: [
      "Advanced code generation & debugging",
      "Multimodal capabilities (text, voice, images)",
      "Web search and real-time data access",
      "Data analysis & charting capabilities",
      "Code review and optimization",
      "Architecture planning and documentation"
    ],
    integrations: ["VS Code", "GitHub Copilot", "Cursor", "OpenAI API", "Custom GPTs"],
    maturityScore: 9.5,
    popularityScore: 9.8,
    pricing: "Free tier, Plus $20/mo, Team $25/user/mo, Enterprise custom",
    notes: "Most mature and popular AI coding assistant with extensive integration ecosystem and proven reliability."
  },
  {
    name: "GitHub Copilot",
    description: "AI pair programmer powered by OpenAI Codex that provides real-time code suggestions and completions directly in your IDE with deep GitHub integration.",
    url: "https://github.com/features/copilot",
    frameworks: ["All major frameworks"],
    languages: ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "C#", "Ruby", "PHP"],
    features: [
      "Real-time code completion",
      "Context-aware suggestions",
      "Code explanation and documentation",
      "Test generation",
      "Bug fix suggestions",
      "Refactoring assistance"
    ],
    integrations: ["VS Code", "Visual Studio", "JetBrains IDEs", "Neovim", "GitHub", "ChatGPT"],
    maturityScore: 9.2,
    popularityScore: 9.3,
    pricing: "Individual $10/mo, Business $19/user/mo, Enterprise $39/user/mo",
    notes: "Industry standard for AI-assisted coding with excellent IDE integration and proven enterprise adoption."
  },
  {
    name: "Claude",
    description: "Advanced AI assistant by Anthropic with strong reasoning capabilities, large context windows, and excellent code generation with safety focus.",
    url: "https://claude.ai",
    frameworks: ["All major frameworks"],
    languages: ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "Swift"],
    features: [
      "Large context window (200K+ tokens)",
      "Advanced reasoning and analysis", 
      "Code generation and debugging",
      "Document analysis and processing",
      "Mathematical problem solving",
      "Safe and responsible AI responses"
    ],
    integrations: ["Bolt", "Lovable", "Anthropic API", "Various IDEs"],
    maturityScore: 8.8,
    popularityScore: 8.5,
    pricing: "Free tier, Pro $20/mo, Team $25/user/mo, Enterprise custom",
    notes: "Strong alternative to ChatGPT with focus on safety and reasoning. Popular choice for AI app builders."
  },
  {
    name: "Cursor",
    description: "AI-powered code editor built on VS Code with native AI integration, offering seamless AI assistance directly in the development environment.",
    url: "https://cursor.sh",
    frameworks: ["All VS Code supported frameworks"],
    languages: ["All major programming languages"],
    features: [
      "Native AI integration in code editor",
      "Context-aware code generation",
      "Codebase-wide understanding",
      "AI-powered debugging",
      "Natural language to code translation",
      "VS Code compatibility and extensions"
    ],
    integrations: ["ChatGPT", "Claude", "GitHub", "VS Code extensions"],
    maturityScore: 8.1,
    popularityScore: 8.7,
    pricing: "Free tier, Pro $20/mo, Business $40/user/mo",
    notes: "Popular among developers for native AI integration. Combines familiar VS Code experience with powerful AI capabilities."
  },

  // Frontend/Design Tools
  {
    name: "React",
    description: "A JavaScript library for building user interfaces with component-based architecture, virtual DOM, and extensive ecosystem support.",
    url: "https://react.dev",
    frameworks: ["Next.js", "Vite", "Create React App", "Remix"],
    languages: ["JavaScript", "TypeScript", "JSX"],
    features: [
      "Component-based architecture",
      "Virtual DOM for performance",
      "React Hooks for state management",
      "Server Components support",
      "Concurrent rendering",
      "Extensive dev tools"
    ],
    integrations: ["Next.js", "Vite", "Webpack", "Babel", "TypeScript", "Redux", "Zustand"],
    maturityScore: 9.5,
    popularityScore: 9.8,
    pricing: "Free (Open Source)",
    notes: "Most popular frontend library with massive ecosystem and community support. Industry standard for modern web development."
  },
  {
    name: "Next.js",
    description: "React framework with server-side rendering, static site generation, and full-stack capabilities for production-ready web applications.",
    url: "https://nextjs.org",
    frameworks: ["React"],
    languages: ["JavaScript", "TypeScript"],
    features: [
      "Server-side rendering (SSR)",
      "Static site generation (SSG)",
      "API Routes for backend logic",
      "App Router with layouts",
      "Server Components",
      "Built-in optimization"
    ],
    integrations: ["Vercel", "React", "Tailwind CSS", "Prisma", "Supabase", "Auth0"],
    maturityScore: 9.2,
    popularityScore: 9.5,
    pricing: "Free (Open Source)",
    notes: "Production-ready React framework with excellent developer experience and deployment optimization."
  },
  {
    name: "Tailwind CSS",
    description: "Utility-first CSS framework for rapidly building custom designs with low-level utility classes and responsive design capabilities.",
    url: "https://tailwindcss.com",
    frameworks: ["Works with all frameworks"],
    languages: ["CSS", "HTML", "JavaScript"],
    features: [
      "Utility-first approach",
      "Responsive design utilities",
      "Dark mode support",
      "Component-friendly",
      "Customizable design system",
      "Purge unused CSS"
    ],
    integrations: ["React", "Vue", "Angular", "Svelte", "Next.js", "Vite"],
    maturityScore: 9.0,
    popularityScore: 9.2,
    pricing: "Free (Open Source), Tailwind UI $149-$999",
    notes: "Extremely popular utility-first CSS framework. Excellent integration with modern frameworks and AI code generators."
  },
  {
    name: "Vite",
    description: "Next-generation build tool that provides fast development server and optimized production builds with excellent hot module replacement.",
    url: "https://vitejs.dev",
    frameworks: ["React", "Vue", "Svelte", "Vanilla"],
    languages: ["JavaScript", "TypeScript"],
    features: [
      "Lightning-fast HMR",
      "Native ES modules",
      "Optimized build with Rollup",
      "Plugin ecosystem",
      "TypeScript support",
      "CSS preprocessor support"
    ],
    integrations: ["React", "Vue", "Svelte", "TypeScript", "Tailwind CSS"],
    maturityScore: 8.7,
    popularityScore: 8.9,
    pricing: "Free (Open Source)",
    notes: "Modern build tool favored by new projects for its speed and developer experience. Used by Lovable and other AI platforms."
  },

  // Backend/Database Tools
  {
    name: "Supabase",
    description: "Open source Firebase alternative with PostgreSQL database, authentication, real-time subscriptions, storage, and edge functions.",
    url: "https://supabase.com",
    frameworks: ["PostgreSQL", "PostgREST", "GoTrue"],
    languages: ["SQL", "JavaScript", "TypeScript", "Python", "Dart"],
    features: [
      "PostgreSQL database with real-time",
      "Built-in authentication and authorization",
      "Row Level Security (RLS)",
      "Auto-generated APIs",
      "File storage with CDN",
      "Edge Functions (Deno runtime)"
    ],
    integrations: ["Lovable", "Next.js", "React", "Flutter", "Vercel v0", "Bolt"],
    maturityScore: 8.5,
    popularityScore: 8.7,
    pricing: "Free tier, Pro $25/project/mo, Team $599/mo, Enterprise custom",
    notes: "Popular choice for full-stack applications with excellent integration with modern frameworks and AI platforms."
  },
  {
    name: "Firebase",
    description: "Google's Backend-as-a-Service platform with NoSQL database, authentication, hosting, cloud functions, and mobile development tools.",
    url: "https://firebase.google.com",
    frameworks: ["Firestore", "Cloud Functions"],
    languages: ["JavaScript", "TypeScript", "Java", "Swift", "Dart"],
    features: [
      "NoSQL Firestore database",
      "Firebase Authentication",
      "Real-time database sync",
      "Cloud Functions serverless",
      "Firebase Hosting",
      "Analytics and monitoring"
    ],
    integrations: ["React", "Angular", "Flutter", "Unity", "iOS", "Android"],
    maturityScore: 9.1,
    popularityScore: 8.8,
    pricing: "Free Spark plan, Blaze pay-as-you-go",
    notes: "Mature Google platform with excellent mobile support and real-time capabilities."
  },
  {
    name: "Prisma",
    description: "Modern database toolkit with type-safe client, schema management, and migrations for SQL databases with excellent TypeScript integration.",
    url: "https://prisma.io",
    frameworks: ["PostgreSQL", "MySQL", "SQLite", "MongoDB"],
    languages: ["TypeScript", "JavaScript"],
    features: [
      "Type-safe database client",
      "Database schema management",
      "Auto-generated migrations",
      "Prisma Studio database GUI",
      "Connection pooling",
      "Real-time subscriptions"
    ],
    integrations: ["Next.js", "NestJS", "GraphQL", "PostgreSQL", "MySQL", "PlanetScale"],
    maturityScore: 8.3,
    popularityScore: 8.1,
    pricing: "Free for developers, Prisma Cloud paid plans",
    notes: "Popular ORM choice for TypeScript projects with excellent developer experience and type safety."
  },

  // Payment Platforms
  {
    name: "Stripe",
    description: "Complete payments platform with APIs for online and in-person payments, subscriptions, marketplace payments, and financial services.",
    url: "https://stripe.com",
    frameworks: ["REST APIs", "SDKs"],
    languages: ["JavaScript", "Python", "Ruby", "PHP", "Java", "Go"],
    features: [
      "Online payment processing",
      "Subscription management",
      "Marketplace payments",
      "Financial services APIs",
      "Fraud prevention",
      "Global payment methods"
    ],
    integrations: ["Lovable", "Base44", "WebSparks", "React", "Next.js", "Shopify"],
    maturityScore: 9.3,
    popularityScore: 9.1,
    pricing: "2.9% + 30¢ per transaction, volume discounts available",
    notes: "Industry-leading payment platform with excellent developer experience and global reach."
  },
  {
    name: "PayPal",
    description: "Global digital payments platform offering online payments, merchant services, and buyer protection with worldwide acceptance.",
    url: "https://paypal.com",
    frameworks: ["REST APIs", "SDK"],
    languages: ["JavaScript", "Python", "Java", "PHP", "C#"],
    features: [
      "Global payment acceptance",
      "Buyer and seller protection",
      "Express Checkout",
      "Subscription billing",
      "Mobile payments",
      "Multi-currency support"
    ],
    integrations: ["E-commerce platforms", "WordPress", "Shopify", "WooCommerce"],
    maturityScore: 9.0,
    popularityScore: 8.5,
    pricing: "2.9% + fixed fee per transaction",
    notes: "Established global payment solution with strong consumer trust and merchant adoption."
  },

  // DevOps/Deployment
  {
    name: "Vercel",
    description: "Frontend cloud platform optimized for React and Next.js with instant deployments, serverless functions, and global CDN.",
    url: "https://vercel.com",
    frameworks: ["Next.js", "React", "Vue", "Svelte"],
    languages: ["JavaScript", "TypeScript", "Go", "Python"],
    features: [
      "Instant deployments from Git",
      "Serverless Functions",
      "Edge Functions worldwide",
      "Automatic HTTPS and CDN",
      "Preview deployments",
      "Web Analytics"
    ],
    integrations: ["GitHub", "GitLab", "Bitbucket", "Next.js", "v0", "Bolt"],
    maturityScore: 8.8,
    popularityScore: 8.6,
    pricing: "Free Hobby plan, Pro $20/user/mo, Team $40/user/mo",
    notes: "Leading platform for frontend deployments with excellent Next.js integration and developer experience."
  },
  {
    name: "Netlify",
    description: "Web development platform for building, deploying and scaling modern web applications with JAMstack architecture focus.",
    url: "https://netlify.com",
    frameworks: ["Static sites", "JAMstack"],
    languages: ["JavaScript", "HTML", "CSS"],
    features: [
      "Continuous deployment from Git",
      "Serverless Functions",
      "Form handling",
      "Identity management",
      "Split testing",
      "Edge computing"
    ],
    integrations: ["GitHub", "GitLab", "Bolt", "Gatsby", "Hugo", "Jekyll"],
    maturityScore: 8.5,
    popularityScore: 8.2,
    pricing: "Free Starter, Pro $19/user/mo, Team $99/team/mo",
    notes: "Popular for static sites and JAMstack applications with strong Git integration and build optimization."
  }
];

// Compatibility mappings based on real-world integrations from the PDF
export const seedCompatibilities: Omit<InsertCompatibility, "toolOneId" | "toolTwoId">[] = [
  // AI Tool Integrations
  { compatibilityScore: 95, notes: "Both OpenAI-based with excellent integration capabilities", verifiedIntegration: 1 },
  { compatibilityScore: 75, notes: "Different models but good interoperability for code generation", verifiedIntegration: 1 },
  { compatibilityScore: 90, notes: "Native ChatGPT integration in Cursor IDE", verifiedIntegration: 1 },
  { compatibilityScore: 85, notes: "Uses OpenAI/Anthropic APIs for code generation", verifiedIntegration: 1 },
  { compatibilityScore: 70, notes: "Integrates well with Copilot suggestions", verifiedIntegration: 1 },
  { compatibilityScore: 90, notes: "Native Anthropic integration in Lovable platform", verifiedIntegration: 1 },
  { compatibilityScore: 75, notes: "Good IDE integration with AI assistance", verifiedIntegration: 1 },

  // Frontend Framework Compatibility
  { compatibilityScore: 98, notes: "Lovable outputs React code natively with TypeScript", verifiedIntegration: 1 },
  { compatibilityScore: 72, notes: "Uses Vite instead of Next.js, but React compatible", verifiedIntegration: 1 },
  { compatibilityScore: 95, notes: "Native Tailwind CSS support in Lovable", verifiedIntegration: 1 },
  { compatibilityScore: 92, notes: "Bolt generates React/Next.js code excellently", verifiedIntegration: 1 },
  { compatibilityScore: 95, notes: "Excellent Next.js support and optimization", verifiedIntegration: 1 },
  { compatibilityScore: 88, notes: "Good Tailwind generation and styling", verifiedIntegration: 1 },
  { compatibilityScore: 98, notes: "v0 is built specifically for React applications", verifiedIntegration: 1 },
  { compatibilityScore: 98, notes: "Optimized for Next.js deployment on Vercel", verifiedIntegration: 1 },
  { compatibilityScore: 93, notes: "Excellent Tailwind integration and generation", verifiedIntegration: 1 },

  // Backend Integration Scores
  { compatibilityScore: 95, notes: "Built-in Supabase integration in Lovable", verifiedIntegration: 1 },
  { compatibilityScore: 55, notes: "Limited Firebase support, prefers Supabase", verifiedIntegration: 0 },
  { compatibilityScore: 80, notes: "Can integrate Supabase via prompts and templates", verifiedIntegration: 1 },
  { compatibilityScore: 65, notes: "Basic Firebase integration available", verifiedIntegration: 1 },
  { compatibilityScore: 85, notes: "Good Supabase integration via prompts", verifiedIntegration: 1 },
  { compatibilityScore: 70, notes: "Standard Firebase integration capabilities", verifiedIntegration: 1 },

  // React ecosystem compatibility
  { compatibilityScore: 98, notes: "Next.js is built on React with full compatibility", verifiedIntegration: 1 },
  { compatibilityScore: 95, notes: "React works excellently with Tailwind utilities", verifiedIntegration: 1 },
  { compatibilityScore: 92, notes: "Vite provides excellent React development experience", verifiedIntegration: 1 },
  { compatibilityScore: 90, notes: "Next.js has built-in Tailwind CSS support", verifiedIntegration: 1 },
  { compatibilityScore: 88, notes: "Vite supports Tailwind with minimal configuration", verifiedIntegration: 1 },

  // Payment platform integrations
  { compatibilityScore: 90, notes: "Stripe integration available in Lovable extensions", verifiedIntegration: 1 },
  { compatibilityScore: 85, notes: "Stripe integration via prompts in Base44", verifiedIntegration: 1 },
  { compatibilityScore: 80, notes: "WebSparks can add Stripe payments via AI instructions", verifiedIntegration: 1 },
  { compatibilityScore: 75, notes: "Standard PayPal integration across platforms", verifiedIntegration: 1 },

  // Deployment platform compatibility
  { compatibilityScore: 95, notes: "Bolt offers built-in Netlify deployment", verifiedIntegration: 1 },
  { compatibilityScore: 98, notes: "v0 provides seamless Vercel deployment", verifiedIntegration: 1 },
  { compatibilityScore: 85, notes: "Tempo Labs supports Vercel deployment", verifiedIntegration: 1 },
  { compatibilityScore: 80, notes: "WebSparks likely integrates with Vercel", verifiedIntegration: 1 },

  // Database compatibility scores
  { compatibilityScore: 92, notes: "Supabase works excellently with React applications", verifiedIntegration: 1 },
  { compatibilityScore: 88, notes: "Firebase has strong React integration", verifiedIntegration: 1 },
  { compatibilityScore: 95, notes: "Supabase and Next.js are commonly used together", verifiedIntegration: 1 },
  { compatibilityScore: 85, notes: "Firebase and Next.js integration is well-supported", verifiedIntegration: 1 },
  { compatibilityScore: 90, notes: "Prisma works well with Supabase PostgreSQL", verifiedIntegration: 1 },

  // Cross-category high compatibility
  { compatibilityScore: 87, notes: "Strong compatibility across modern web stack", verifiedIntegration: 1 },
  { compatibilityScore: 83, notes: "Good integration for full-stack applications", verifiedIntegration: 1 },
  { compatibilityScore: 79, notes: "Decent compatibility with some configuration needed", verifiedIntegration: 1 },
  { compatibilityScore: 91, notes: "Excellent compatibility for production applications", verifiedIntegration: 1 },
];

// Helper function to get category ID by name
export const getCategoryIdByName = (categories: any[], name: string): string => {
  const category = categories.find(cat => cat.name === name);
  return category?.id || '';
};

// Helper function to create tools with proper category references
export const createToolsWithCategories = (categories: any[]) => {
  const categoryMap: Record<string, string> = {
    "AI Coding Tools": getCategoryIdByName(categories, "AI Coding Tools"),
    "Frontend/Design": getCategoryIdByName(categories, "Frontend/Design"), 
    "Backend/Database": getCategoryIdByName(categories, "Backend/Database"),
    "Payment Platforms": getCategoryIdByName(categories, "Payment Platforms"),
    "DevOps/Deployment": getCategoryIdByName(categories, "DevOps/Deployment")
  };

  const toolCategories = [
    // AI Coding Tools
    "AI Coding Tools", "AI Coding Tools", "AI Coding Tools", "AI Coding Tools", "AI Coding Tools",
    "AI Coding Tools", "AI Coding Tools", "AI Coding Tools", "AI Coding Tools", "AI Coding Tools", "AI Coding Tools",
    // Frontend/Design Tools  
    "Frontend/Design", "Frontend/Design", "Frontend/Design", "Frontend/Design",
    // Backend/Database Tools
    "Backend/Database", "Backend/Database", "Backend/Database",
    // Payment Platforms
    "Payment Platforms", "Payment Platforms",
    // DevOps/Deployment
    "DevOps/Deployment", "DevOps/Deployment"
  ];

  return seedTools.map((tool, index) => ({
    ...tool,
    categoryId: categoryMap[toolCategories[index]]
  }));
};

export default {
  seedCategories,
  seedTools,
  seedCompatibilities,
  getCategoryIdByName,
  createToolsWithCategories
};
