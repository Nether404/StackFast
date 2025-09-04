import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Book,
  Rocket,
  Code,
  Database,
  Layers,
  GitCompare,
  Sparkles,
  Grid3x3,
  BarChart3,
  Search,
  Settings,
  HelpCircle,
  ChevronRight,
  Terminal,
  Zap,
  Shield,
  Users,
  Globe,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  Cpu,
  ArrowRight,
  Command,
  Package,
  Target,
  Lightbulb,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { Link } from "wouter";

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const navigationSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Rocket,
      items: [
        { id: "intro", title: "Introduction" },
        { id: "quick-start", title: "Quick Start Guide" },
        { id: "first-stack", title: "Build Your First Stack" },
        { id: "concepts", title: "Core Concepts" },
      ],
    },
    {
      id: "features",
      title: "Features",
      icon: Layers,
      items: [
        { id: "stack-builder", title: "Stack Builder" },
        { id: "ai-blueprint", title: "AI Blueprint Generator" },
        { id: "tool-database", title: "Tool Database" },
        { id: "comparison", title: "Tool Comparison" },
        { id: "compatibility", title: "Compatibility Matrix" },
        { id: "analytics", title: "Analytics Dashboard" },
      ],
    },
    {
      id: "guides",
      title: "User Guides",
      icon: BookOpen,
      items: [
        { id: "search-tools", title: "Searching for Tools" },
        { id: "build-stack", title: "Building a Tech Stack" },
        { id: "compare-tools", title: "Comparing Tools" },
        { id: "migration", title: "Migration Planning" },
        { id: "export-import", title: "Export & Import" },
        { id: "collaboration", title: "Collaboration Features" },
      ],
    },
    {
      id: "api",
      title: "API Reference",
      icon: Code,
      items: [
        { id: "api-intro", title: "API Introduction" },
        { id: "endpoints", title: "Endpoints" },
        { id: "authentication", title: "Authentication" },
        { id: "rate-limits", title: "Rate Limits" },
        { id: "examples", title: "Code Examples" },
      ],
    },
    {
      id: "best-practices",
      title: "Best Practices",
      icon: Target,
      items: [
        { id: "stack-design", title: "Stack Design Principles" },
        { id: "tool-selection", title: "Tool Selection Criteria" },
        { id: "scaling", title: "Scaling Considerations" },
        { id: "security", title: "Security Guidelines" },
        { id: "cost-optimization", title: "Cost Optimization" },
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: HelpCircle,
      items: [
        { id: "common-issues", title: "Common Issues" },
        { id: "faqs", title: "FAQs" },
        { id: "support", title: "Getting Support" },
        { id: "bug-reporting", title: "Reporting Bugs" },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "getting-started":
        return <GettingStartedContent />;
      case "features":
        return <FeaturesContent />;
      case "guides":
        return <UserGuidesContent />;
      case "api":
        return <APIReferenceContent />;
      case "best-practices":
        return <BestPracticesContent />;
      case "troubleshooting":
        return <TroubleshootingContent />;
      default:
        return <GettingStartedContent />;
    }
  };

  return (
    <div className="flex gap-8 max-w-7xl mx-auto">
      {/* Sidebar Navigation */}
      <aside className="w-64 sticky top-20 h-fit">
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <nav className="space-y-6">
            {navigationSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 font-semibold text-sm mb-2 hover:text-neon-orange transition-colors ${
                      activeSection === section.id ? "text-neon-orange" : "text-github-text"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.title}
                  </button>
                  <ul className="space-y-1 ml-6">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="text-sm text-github-text-secondary hover:text-github-text transition-colors block py-1"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="prose prose-invert max-w-none">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function GettingStartedContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4 text-github-text">Documentation</h1>
        <p className="text-lg text-github-text-secondary">
          Everything you need to know about TechStack Explorer
        </p>
      </div>

      <Card className="bg-gradient-to-r from-purple-600/10 to-purple-600/5 border-purple-600/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-purple-400" />
            Welcome to TechStack Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <p className="text-github-text-secondary">
            TechStack Explorer is a comprehensive platform that helps developers discover, compare, and build optimal technology stacks for their projects. 
            With AI-powered recommendations and extensive compatibility analysis, we make it easy to make informed decisions about your development tools.
          </p>
        </CardContent>
      </Card>

      <section id="intro" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Introduction</h2>
        <div className="space-y-4 text-github-text-secondary">
          <p>
            TechStack Explorer combines a curated database of development tools with intelligent compatibility scoring and AI-powered recommendations. 
            Whether you're starting a new project or optimizing an existing one, our platform provides the insights you need to build better, faster, and more efficiently.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-400" />
                  Comprehensive Tool Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-github-text-secondary">
                  Access detailed information on hundreds of development tools, frameworks, and services, all carefully categorized and analyzed.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neon-orange" />
                  AI-Powered Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-github-text-secondary">
                  Get personalized tech stack recommendations based on your project requirements, timeline, and budget constraints.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4 text-green-400" />
                  Compatibility Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-github-text-secondary">
                  View detailed compatibility scores between tools to ensure your tech stack components work seamlessly together.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-purple-400" />
                  Side-by-Side Comparisons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-github-text-secondary">
                  Compare tools across multiple dimensions including features, pricing, performance, and community support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="quick-start" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Quick Start Guide</h2>
        <div className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="text-lg">5-Minute Quick Start</CardTitle>
              <CardDescription>Get up and running with TechStack Explorer in just a few minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-neon-orange rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-github-text mb-1">Explore the Dashboard</h4>
                    <p className="text-sm text-github-text-secondary">
                      Start from the dashboard to get an overview of available tools, popular categories, and quick actions.
                      The dashboard provides statistics and highlights to help you navigate the platform.
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-neon-orange rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-github-text mb-1">Try the AI Blueprint Generator</h4>
                    <p className="text-sm text-github-text-secondary">
                      Click on "AI Blueprint" and describe your project idea in natural language. 
                      Our AI will generate a complete tech stack recommendation tailored to your needs.
                    </p>
                    <Link href="/blueprint">
                      <Button size="sm" className="mt-2" variant="outline">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Try AI Blueprint
                      </Button>
                    </Link>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-neon-orange rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-github-text mb-1">Build Your Stack Manually</h4>
                    <p className="text-sm text-github-text-secondary">
                      Use the Stack Builder to manually select and combine tools. 
                      The compatibility checker will ensure your choices work well together.
                    </p>
                    <Link href="/stack-builder">
                      <Button size="sm" className="mt-2" variant="outline">
                        <Layers className="h-3 w-3 mr-1" />
                        Open Stack Builder
                      </Button>
                    </Link>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-neon-orange rounded-full flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-github-text mb-1">Browse and Compare Tools</h4>
                    <p className="text-sm text-github-text-secondary">
                      Explore the tool database to discover new options, or use the comparison feature to evaluate alternatives side-by-side.
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-neon-orange rounded-full flex items-center justify-center text-white font-bold">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-github-text mb-1">Use Keyboard Shortcuts</h4>
                    <p className="text-sm text-github-text-secondary">
                      Press <kbd className="px-2 py-1 bg-github-dark rounded text-xs">⌘K</kbd> to open the command palette for quick navigation and actions.
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="first-stack" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Build Your First Stack</h2>
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai">AI-Assisted</TabsTrigger>
            <TabsTrigger value="manual">Manual Builder</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="space-y-4">
            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle>Using AI Blueprint Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-github-text-secondary">
                  The fastest way to get a complete tech stack recommendation is using our AI Blueprint Generator.
                </p>
                
                <div className="bg-github-dark p-4 rounded-lg">
                  <h4 className="font-semibold text-github-text mb-2">Example Prompts:</h4>
                  <ul className="space-y-2 text-sm text-github-text-secondary">
                    <li>• "I want to build an e-commerce platform with React and Node.js"</li>
                    <li>• "Create a mobile app for fitness tracking with real-time features"</li>
                    <li>• "SaaS application for project management with team collaboration"</li>
                    <li>• "Blog platform with CMS capabilities and SEO optimization"</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-github-text">The AI will provide:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Frontend framework recommendations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Backend technology suggestions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Database options</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Deployment platforms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Development tools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Cost estimates</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle>Using Stack Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-github-text-secondary">
                  Build your tech stack step by step with full control over every component.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Step 1</Badge>
                    <div>
                      <h4 className="font-semibold text-github-text">Choose Your Category</h4>
                      <p className="text-sm text-github-text-secondary mt-1">
                        Start by selecting the type of tools you need: Frontend, Backend, Database, DevOps, etc.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Step 2</Badge>
                    <div>
                      <h4 className="font-semibold text-github-text">Browse Available Tools</h4>
                      <p className="text-sm text-github-text-secondary mt-1">
                        Explore tools within each category. Use filters for pricing, popularity, and maturity.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Step 3</Badge>
                    <div>
                      <h4 className="font-semibold text-github-text">Check Compatibility</h4>
                      <p className="text-sm text-github-text-secondary mt-1">
                        The builder automatically checks compatibility between your selected tools and warns of any conflicts.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Step 4</Badge>
                    <div>
                      <h4 className="font-semibold text-github-text">Review and Export</h4>
                      <p className="text-sm text-github-text-secondary mt-1">
                        Review your complete stack, see cost estimates, and export your configuration.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section id="concepts" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Core Concepts</h2>
        <div className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Understanding Key Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tech-stack">
                  <AccordionTrigger>What is a Tech Stack?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-github-text-secondary">
                      A tech stack is the combination of technologies used to build and run an application. 
                      It typically includes programming languages, frameworks, databases, and infrastructure tools. 
                      A well-designed tech stack ensures all components work harmoniously together.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="compatibility-score">
                  <AccordionTrigger>Compatibility Scores Explained</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-github-text-secondary mb-2">
                      Compatibility scores range from 0-100 and indicate how well two tools work together:
                    </p>
                    <ul className="space-y-1 text-sm text-github-text-secondary">
                      <li>• <Badge className="bg-green-600/20 text-green-400 border-green-600/30">80-100</Badge> Excellent - Seamless integration</li>
                      <li>• <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">60-79</Badge> Good - Works well with minor configuration</li>
                      <li>• <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">40-59</Badge> Fair - Requires additional setup</li>
                      <li>• <Badge className="bg-red-600/20 text-red-400 border-red-600/30">0-39</Badge> Poor - Significant challenges expected</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="maturity-score">
                  <AccordionTrigger>Maturity and Popularity Scores</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-github-text-secondary">
                      <strong>Maturity Score:</strong> Indicates how established and stable a tool is based on age, version history, and enterprise adoption.
                      <br /><br />
                      <strong>Popularity Score:</strong> Reflects community adoption, GitHub stars, npm downloads, and developer satisfaction ratings.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="categories">
                  <AccordionTrigger>Tool Categories</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-github-text-secondary">
                      <div>• <strong>IDE/Development:</strong> Code editors and integrated development environments</div>
                      <div>• <strong>AI Coding Tools:</strong> AI-powered code generation and assistance</div>
                      <div>• <strong>Backend/Database:</strong> Server frameworks and data storage solutions</div>
                      <div>• <strong>Frontend/Design:</strong> UI frameworks and design tools</div>
                      <div>• <strong>DevOps/Deployment:</strong> CI/CD, containerization, and hosting</div>
                      <div>• <strong>Payment Platforms:</strong> Payment processing and e-commerce tools</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function FeaturesContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4 text-github-text">Features</h1>
        <p className="text-lg text-github-text-secondary">
          Deep dive into all the powerful features TechStack Explorer offers
        </p>
      </div>

      <section id="stack-builder" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Stack Builder</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-green-400" />
              Visual Tech Stack Construction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-github-text-secondary">
              The Stack Builder provides an intuitive interface for constructing your technology stack piece by piece.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-github-text">Key Features:</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>✓ Drag-and-drop interface</li>
                  <li>✓ Real-time compatibility checking</li>
                  <li>✓ Cost estimation calculator</li>
                  <li>✓ Performance impact analysis</li>
                  <li>✓ Export to JSON/YAML</li>
                  <li>✓ Share via URL</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-github-text">Advanced Options:</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>✓ Version locking</li>
                  <li>✓ Alternative suggestions</li>
                  <li>✓ Dependency visualization</li>
                  <li>✓ Performance benchmarks</li>
                  <li>✓ Team size recommendations</li>
                  <li>✓ Learning curve estimates</li>
                </ul>
              </div>
            </div>
            
            <Alert className="bg-blue-600/10 border-blue-600/30">
              <Lightbulb className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-github-text-secondary">
                <strong>Pro Tip:</strong> Start with your core requirements (e.g., programming language) and let the builder suggest compatible additions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      <section id="ai-blueprint" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">AI Blueprint Generator</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-orange" />
              Intelligent Stack Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-github-text-secondary">
              Describe your project in natural language and receive a complete, optimized tech stack recommendation powered by AI.
            </p>
            
            <div className="bg-github-dark p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-github-text">How It Works:</h4>
              <ol className="space-y-2 text-sm text-github-text-secondary">
                <li>1. Describe your project idea, requirements, and constraints</li>
                <li>2. AI analyzes your needs and considers thousands of tool combinations</li>
                <li>3. Receive a detailed blueprint with explanations for each choice</li>
                <li>4. Customize the suggestions based on your preferences</li>
                <li>5. Export or directly implement the recommended stack</li>
              </ol>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Input Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-github-text-secondary">
                    <li>• Project type and scale</li>
                    <li>• Team size and expertise</li>
                    <li>• Budget constraints</li>
                    <li>• Timeline requirements</li>
                    <li>• Performance needs</li>
                    <li>• Security requirements</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Output Includes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-github-text-secondary">
                    <li>• Complete tool list</li>
                    <li>• Integration guidelines</li>
                    <li>• Setup instructions</li>
                    <li>• Cost breakdown</li>
                    <li>• Scaling roadmap</li>
                    <li>• Alternative options</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="tool-database" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Tool Database</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Comprehensive Tool Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-github-text-secondary">
              Browse our extensive database of development tools with detailed information, ratings, and compatibility data.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-github-text">Available Filters:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Badge variant="outline">Category</Badge>
                <Badge variant="outline">Pricing Model</Badge>
                <Badge variant="outline">Popularity Score</Badge>
                <Badge variant="outline">Maturity Level</Badge>
                <Badge variant="outline">Programming Language</Badge>
                <Badge variant="outline">Framework Support</Badge>
                <Badge variant="outline">Platform</Badge>
                <Badge variant="outline">License Type</Badge>
                <Badge variant="outline">Company Size</Badge>
              </div>
            </div>
            
            <div className="bg-github-dark p-4 rounded-lg">
              <h4 className="font-semibold text-github-text mb-2">Search Tips:</h4>
              <ul className="space-y-1 text-sm text-github-text-secondary">
                <li>• Use quotes for exact matches: "react native"</li>
                <li>• Combine filters for precision: category:frontend pricing:free</li>
                <li>• Sort by multiple criteria: popularity + maturity</li>
                <li>• Save searches for quick access</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="comparison" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Tool Comparison</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-purple-400" />
              Side-by-Side Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-github-text-secondary">
              Compare up to 4 tools simultaneously across multiple dimensions to make informed decisions.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-github-text">Comparison Criteria:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-github-text-secondary">
                <div>
                  <strong className="text-github-text">Technical:</strong>
                  <ul className="mt-1 space-y-1 ml-4">
                    <li>• Performance benchmarks</li>
                    <li>• Feature completeness</li>
                    <li>• Integration capabilities</li>
                    <li>• Scalability limits</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-github-text">Business:</strong>
                  <ul className="mt-1 space-y-1 ml-4">
                    <li>• Total cost of ownership</li>
                    <li>• Support quality</li>
                    <li>• Vendor stability</li>
                    <li>• Community size</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="compatibility" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Compatibility Matrix</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-green-400" />
              Visual Compatibility Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-github-text-secondary">
              Visualize tool relationships and compatibility scores through interactive matrices and heatmaps.
            </p>
            
            <Tabs defaultValue="matrix" className="w-full">
              <TabsList>
                <TabsTrigger value="matrix">Matrix View</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                <TabsTrigger value="migration">Migration Wizard</TabsTrigger>
              </TabsList>
              
              <TabsContent value="matrix" className="mt-4">
                <p className="text-sm text-github-text-secondary">
                  Interactive grid showing compatibility scores between all tool pairs. 
                  Click any cell for detailed integration information.
                </p>
              </TabsContent>
              
              <TabsContent value="heatmap" className="mt-4">
                <p className="text-sm text-github-text-secondary">
                  Color-coded visualization highlighting compatibility patterns. 
                  Green indicates high compatibility, red shows potential conflicts.
                </p>
              </TabsContent>
              
              <TabsContent value="migration" className="mt-4">
                <p className="text-sm text-github-text-secondary">
                  Step-by-step guidance for migrating between tools, including time estimates, 
                  risk assessments, and rollback strategies.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section id="analytics" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Analytics Dashboard</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Data-Driven Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-github-text-secondary">
              Track trends, analyze patterns, and make data-driven decisions with our comprehensive analytics.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-github-text-secondary">
                    Track tool adoption trends over time
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Stack Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-github-text-secondary">
                    Discover common tool combinations
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-github-text-secondary">
                    Compare pricing across stacks
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function UserGuidesContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4 text-github-text">User Guides</h1>
        <p className="text-lg text-github-text-secondary">
          Step-by-step guides for common tasks and workflows
        </p>
      </div>

      <section id="search-tools" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Searching for Tools</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Effective Search Strategies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-github-text mb-2">Basic Search</h4>
                <p className="text-sm text-github-text-secondary mb-2">
                  Use the global search bar (⌘K) or navigate to the Tool Database for comprehensive searching.
                </p>
                <div className="bg-github-dark p-3 rounded text-sm font-mono">
                  Examples: "react", "database", "payment gateway"
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-github-text mb-2">Advanced Search</h4>
                <p className="text-sm text-github-text-secondary mb-2">
                  Combine keywords with filters for precise results:
                </p>
                <div className="bg-github-dark p-3 rounded text-sm font-mono space-y-1">
                  <div>category:frontend framework:react</div>
                  <div>pricing:free popularity:&gt;7</div>
                  <div>maturity:high language:javascript</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-github-text mb-2">Using Filters</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>• Click filter badges to toggle them on/off</li>
                  <li>• Combine multiple filters for narrowed results</li>
                  <li>• Save filter combinations for reuse</li>
                  <li>• Reset filters with the clear button</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="build-stack" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Building a Tech Stack</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Complete Stack Building Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="planning">
                <AccordionTrigger>1. Planning Your Stack</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-github-text-secondary">
                    Before selecting tools, clearly define your requirements:
                  </p>
                  <ul className="space-y-1 text-sm text-github-text-secondary ml-4">
                    <li>• Project type (web app, mobile, API, etc.)</li>
                    <li>• Expected user base and scale</li>
                    <li>• Team size and expertise</li>
                    <li>• Budget constraints</li>
                    <li>• Performance requirements</li>
                    <li>• Security and compliance needs</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="selecting">
                <AccordionTrigger>2. Selecting Core Components</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-github-text-secondary">
                    Start with foundational choices that will influence other decisions:
                  </p>
                  <ol className="space-y-2 text-sm text-github-text-secondary ml-4">
                    <li>1. <strong>Programming Language:</strong> Based on team expertise and project needs</li>
                    <li>2. <strong>Framework:</strong> Choose based on language and application type</li>
                    <li>3. <strong>Database:</strong> Consider data structure and scalability</li>
                    <li>4. <strong>Hosting:</strong> Balance cost, performance, and management overhead</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="validation">
                <AccordionTrigger>3. Validating Compatibility</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-github-text-secondary">
                    Use the compatibility checker to ensure your choices work well together:
                  </p>
                  <ul className="space-y-1 text-sm text-github-text-secondary ml-4">
                    <li>• Review automatic compatibility warnings</li>
                    <li>• Check integration documentation</li>
                    <li>• Consider community experiences</li>
                    <li>• Test critical integrations early</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="optimization">
                <AccordionTrigger>4. Optimizing Your Stack</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-sm text-github-text-secondary">
                    Fine-tune your selections for optimal performance and cost:
                  </p>
                  <ul className="space-y-1 text-sm text-github-text-secondary ml-4">
                    <li>• Eliminate redundant tools</li>
                    <li>• Consider all-in-one solutions vs specialized tools</li>
                    <li>• Evaluate total cost including hidden expenses</li>
                    <li>• Plan for future scaling needs</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <section id="compare-tools" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Comparing Tools</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Making Informed Comparisons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-github-text-secondary">
              Use the comparison feature to evaluate tools objectively across multiple dimensions.
            </p>
            
            <div className="bg-github-dark p-4 rounded-lg">
              <h4 className="font-semibold text-github-text mb-2">Comparison Best Practices:</h4>
              <ol className="space-y-2 text-sm text-github-text-secondary">
                <li>1. Compare tools within the same category</li>
                <li>2. Weight criteria based on your priorities</li>
                <li>3. Consider both current and future needs</li>
                <li>4. Look beyond features to ecosystem and support</li>
                <li>5. Factor in switching costs if replacing existing tools</li>
              </ol>
            </div>
            
            <Alert className="bg-yellow-600/10 border-yellow-600/30">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-github-text-secondary">
                <strong>Important:</strong> Don't just choose the highest-rated tool. The best choice depends on your specific context and requirements.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      <section id="migration" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Migration Planning</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Safe Tool Migration Strategies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-github-text-secondary">
              Plan and execute tool migrations with minimal disruption using our migration wizard.
            </p>
            
            <div className="space-y-3">
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-400" />
                    Pre-Migration Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-github-text-secondary">
                    <li>☐ Document current tool configuration</li>
                    <li>☐ Identify all dependencies</li>
                    <li>☐ Create data backup strategy</li>
                    <li>☐ Plan rollback procedures</li>
                    <li>☐ Schedule migration window</li>
                    <li>☐ Notify stakeholders</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    Migration Phases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1 text-sm text-github-text-secondary">
                    <li>1. <strong>Preparation:</strong> Set up new tool in parallel</li>
                    <li>2. <strong>Testing:</strong> Validate functionality with subset</li>
                    <li>3. <strong>Migration:</strong> Transfer data and configurations</li>
                    <li>4. <strong>Validation:</strong> Verify complete functionality</li>
                    <li>5. <strong>Cutover:</strong> Switch production traffic</li>
                    <li>6. <strong>Monitoring:</strong> Watch for issues post-migration</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="export-import" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Export & Import</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Sharing and Backing Up Your Stacks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-github-text mb-2">Export Options</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>• JSON format for re-import</li>
                  <li>• YAML for configuration files</li>
                  <li>• Markdown for documentation</li>
                  <li>• CSV for spreadsheet analysis</li>
                  <li>• Shareable URL for collaboration</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-github-text mb-2">Import Sources</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>• Upload JSON/YAML files</li>
                  <li>• Import from URL</li>
                  <li>• Paste configuration text</li>
                  <li>• Connect to GitHub repo</li>
                  <li>• Sync with team workspace</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="collaboration" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Collaboration Features</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              Working with Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-github-text-secondary">
              Collaborate with your team to build and maintain tech stacks together.
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-github-text mb-2">Sharing Options</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>• Generate shareable links with view/edit permissions</li>
                  <li>• Create team workspaces for shared stacks</li>
                  <li>• Comment on tool selections</li>
                  <li>• Track change history</li>
                  <li>• Vote on tool choices</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-github-text mb-2">Team Features</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>• Role-based access control</li>
                  <li>• Approval workflows for changes</li>
                  <li>• Team templates and standards</li>
                  <li>• Shared tool evaluations</li>
                  <li>• Centralized documentation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function APIReferenceContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4 text-github-text">API Reference</h1>
        <p className="text-lg text-github-text-secondary">
          Integrate TechStack Explorer data into your applications
        </p>
      </div>

      <section id="api-intro" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">API Introduction</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>RESTful API Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-github-text-secondary">
              The TechStack Explorer API provides programmatic access to our tool database, compatibility scores, and AI recommendations.
            </p>
            
            <div className="bg-github-dark p-4 rounded-lg">
              <h4 className="font-semibold text-github-text mb-2">Base URL</h4>
              <code className="text-sm text-green-400">https://api.techstackexplorer.com/v1</code>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-github-text">Key Features:</h4>
              <ul className="space-y-1 text-sm text-github-text-secondary">
                <li>• RESTful design principles</li>
                <li>• JSON response format</li>
                <li>• Pagination support</li>
                <li>• Filtering and sorting</li>
                <li>• Rate limiting protection</li>
                <li>• Webhook support for updates</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="endpoints" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Endpoints</h2>
        
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Available Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tools" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                <TabsTrigger value="stacks">Stacks</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tools" className="space-y-3">
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">GET /api/tools</div>
                    <p className="text-github-text-secondary text-xs">List all tools with optional filters</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">GET /api/tools/:id</div>
                    <p className="text-github-text-secondary text-xs">Get detailed information for a specific tool</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">GET /api/tools/search</div>
                    <p className="text-github-text-secondary text-xs">Search tools with query parameters</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">GET /api/categories</div>
                    <p className="text-github-text-secondary text-xs">List all tool categories</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="compatibility" className="space-y-3">
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">GET /api/compatibility/:tool1/:tool2</div>
                    <p className="text-github-text-secondary text-xs">Get compatibility score between two tools</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">GET /api/compatibility-matrix</div>
                    <p className="text-github-text-secondary text-xs">Get full compatibility matrix</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">POST /api/v1/migration/:fromTool/:toTool</div>
                    <p className="text-github-text-secondary text-xs">Generate migration plan between tools</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="stacks" className="space-y-3">
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">POST /api/v1/stack/validate</div>
                    <p className="text-github-text-secondary text-xs">Validate a tech stack configuration</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">POST /api/v1/stack/compatibility-report</div>
                    <p className="text-github-text-secondary text-xs">Generate compatibility report for a stack</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">GET /api/stack-templates</div>
                    <p className="text-github-text-secondary text-xs">Get pre-built stack templates</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ai" className="space-y-3">
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">POST /api/v1/blueprint</div>
                    <p className="text-github-text-secondary text-xs">Generate AI-powered tech stack blueprint</p>
                  </div>
                </div>
                
                <div className="bg-github-dark p-3 rounded-lg">
                  <div className="font-mono text-sm">
                    <div className="text-green-400 mb-2">POST /api/v1/tools/recommend</div>
                    <p className="text-github-text-secondary text-xs">Get AI tool recommendations</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section id="authentication" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Authentication</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>API Authentication Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-github-text-secondary">
              Secure your API requests using one of our supported authentication methods.
            </p>
            
            <div className="bg-github-dark p-4 rounded-lg">
              <h4 className="font-semibold text-github-text mb-2">API Key Authentication</h4>
              <code className="text-sm text-green-400">
                Authorization: Bearer YOUR_API_KEY
              </code>
              <p className="text-xs text-github-text-secondary mt-2">
                Include your API key in the Authorization header of each request.
              </p>
            </div>
            
            <Alert className="bg-blue-600/10 border-blue-600/30">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-github-text-secondary">
                Keep your API keys secure and never expose them in client-side code.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      <section id="rate-limits" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Rate Limits</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>API Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-github-border">
                    <th className="text-left py-2">Plan</th>
                    <th className="text-left py-2">Requests/Hour</th>
                    <th className="text-left py-2">Burst Limit</th>
                  </tr>
                </thead>
                <tbody className="text-github-text-secondary">
                  <tr className="border-b border-github-border">
                    <td className="py-2">Free</td>
                    <td className="py-2">100</td>
                    <td className="py-2">10/min</td>
                  </tr>
                  <tr className="border-b border-github-border">
                    <td className="py-2">Pro</td>
                    <td className="py-2">1,000</td>
                    <td className="py-2">50/min</td>
                  </tr>
                  <tr className="border-b border-github-border">
                    <td className="py-2">Enterprise</td>
                    <td className="py-2">10,000</td>
                    <td className="py-2">500/min</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-github-dark p-3 rounded-lg">
              <h4 className="font-semibold text-github-text mb-2">Rate Limit Headers</h4>
              <ul className="space-y-1 text-sm text-github-text-secondary font-mono">
                <li>X-RateLimit-Limit: 100</li>
                <li>X-RateLimit-Remaining: 95</li>
                <li>X-RateLimit-Reset: 1640995200</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="examples" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Code Examples</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Implementation Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="javascript" className="space-y-3">
                <div className="bg-github-dark p-4 rounded-lg">
                  <pre className="text-sm text-github-text overflow-x-auto">
{`// Fetch tools with filters
const response = await fetch('https://api.techstackexplorer.com/v1/tools', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const tools = await response.json();
console.log(tools);

// Generate AI blueprint
const blueprint = await fetch('https://api.techstackexplorer.com/v1/blueprint', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectIdea: 'E-commerce platform with React',
    budget: 'medium',
    timeline: '3 months'
  })
});

const result = await blueprint.json();`}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="python" className="space-y-3">
                <div className="bg-github-dark p-4 rounded-lg">
                  <pre className="text-sm text-github-text overflow-x-auto">
{`import requests

# Fetch tools with filters
headers = {'Authorization': 'Bearer YOUR_API_KEY'}
response = requests.get(
    'https://api.techstackexplorer.com/v1/tools',
    headers=headers
)
tools = response.json()

# Generate AI blueprint
blueprint_data = {
    'projectIdea': 'E-commerce platform with React',
    'budget': 'medium',
    'timeline': '3 months'
}

blueprint = requests.post(
    'https://api.techstackexplorer.com/v1/blueprint',
    headers=headers,
    json=blueprint_data
)
result = blueprint.json()`}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="curl" className="space-y-3">
                <div className="bg-github-dark p-4 rounded-lg">
                  <pre className="text-sm text-github-text overflow-x-auto">
{`# Fetch tools with filters
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.techstackexplorer.com/v1/tools

# Generate AI blueprint
curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"projectIdea":"E-commerce platform","budget":"medium"}' \\
  https://api.techstackexplorer.com/v1/blueprint`}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function BestPracticesContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4 text-github-text">Best Practices</h1>
        <p className="text-lg text-github-text-secondary">
          Industry-proven strategies for building and maintaining tech stacks
        </p>
      </div>

      <section id="stack-design" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Stack Design Principles</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Building Robust Tech Stacks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">✅ Do's</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-github-text-secondary">
                    <li>• Start with proven, stable tools</li>
                    <li>• Consider team expertise</li>
                    <li>• Plan for scalability from day one</li>
                    <li>• Choose tools with strong ecosystems</li>
                    <li>• Prioritize security and compliance</li>
                    <li>• Document all decisions</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">❌ Don'ts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-github-text-secondary">
                    <li>• Over-engineer for hypothetical needs</li>
                    <li>• Choose based on hype alone</li>
                    <li>• Ignore maintenance overhead</li>
                    <li>• Mix incompatible paradigms</li>
                    <li>• Neglect backup and recovery</li>
                    <li>• Forget about vendor lock-in</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="tool-selection" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Tool Selection Criteria</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Evaluation Framework</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="technical">
                <AccordionTrigger>Technical Criteria</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-github-text-secondary">
                    <li>• <strong>Performance:</strong> Benchmarks, scalability limits, resource efficiency</li>
                    <li>• <strong>Features:</strong> Core functionality, extensibility, API completeness</li>
                    <li>• <strong>Integration:</strong> Compatible with existing stack, webhook support</li>
                    <li>• <strong>Security:</strong> Encryption, compliance certifications, audit trails</li>
                    <li>• <strong>Reliability:</strong> Uptime history, disaster recovery, SLA guarantees</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="business">
                <AccordionTrigger>Business Criteria</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-github-text-secondary">
                    <li>• <strong>Cost:</strong> Licensing, infrastructure, maintenance, training</li>
                    <li>• <strong>Support:</strong> Documentation quality, response times, community</li>
                    <li>• <strong>Vendor:</strong> Financial stability, roadmap alignment, reputation</li>
                    <li>• <strong>Flexibility:</strong> Contract terms, data portability, exit strategy</li>
                    <li>• <strong>Compliance:</strong> Industry regulations, data residency, privacy</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="team">
                <AccordionTrigger>Team Criteria</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-github-text-secondary">
                    <li>• <strong>Learning Curve:</strong> Time to productivity, training resources</li>
                    <li>• <strong>Developer Experience:</strong> Tooling, debugging, local development</li>
                    <li>• <strong>Hiring Pool:</strong> Availability of skilled developers</li>
                    <li>• <strong>Team Preference:</strong> Alignment with team culture and workflow</li>
                    <li>• <strong>Knowledge Transfer:</strong> Documentation, onboarding ease</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <section id="scaling" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Scaling Considerations</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Planning for Growth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-github-text mb-2">Horizontal vs Vertical Scaling</h4>
                <p className="text-sm text-github-text-secondary">
                  Choose tools that support your preferred scaling strategy. 
                  Cloud-native tools typically excel at horizontal scaling, 
                  while traditional databases may require vertical scaling initially.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-github-text mb-2">Performance Bottlenecks</h4>
                <div className="bg-github-dark p-3 rounded-lg">
                  <ul className="space-y-1 text-sm text-github-text-secondary">
                    <li>• Database queries and connection pooling</li>
                    <li>• API rate limits and quotas</li>
                    <li>• Network latency and bandwidth</li>
                    <li>• Memory leaks and garbage collection</li>
                    <li>• Synchronous operations and blocking I/O</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-github-text mb-2">Scaling Milestones</h4>
                <div className="grid md:grid-cols-3 gap-2">
                  <Badge variant="outline" className="justify-center py-2">
                    <div className="text-center">
                      <div className="font-bold">1-100 users</div>
                      <div className="text-xs">Monolithic OK</div>
                    </div>
                  </Badge>
                  <Badge variant="outline" className="justify-center py-2">
                    <div className="text-center">
                      <div className="font-bold">100-10K users</div>
                      <div className="text-xs">Consider caching</div>
                    </div>
                  </Badge>
                  <Badge variant="outline" className="justify-center py-2">
                    <div className="text-center">
                      <div className="font-bold">10K+ users</div>
                      <div className="text-xs">Microservices</div>
                    </div>
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="security" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Security Guidelines</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Security-First Stack Design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-600/10 border-red-600/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-github-text-secondary">
                Security should be considered at every layer of your stack, not added as an afterthought.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Card className="bg-github-dark border-github-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Essential Security Measures</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-github-text-secondary">
                    <li>☑ Use HTTPS everywhere</li>
                    <li>☑ Implement proper authentication</li>
                    <li>☑ Enable audit logging</li>
                    <li>☑ Regular security updates</li>
                    <li>☑ Principle of least privilege</li>
                    <li>☑ Data encryption at rest and in transit</li>
                    <li>☑ Regular backups and disaster recovery</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="cost-optimization" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Cost Optimization</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>Managing Stack Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-github-text mb-2">Cost Reduction Strategies</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>• Use open-source alternatives when appropriate</li>
                  <li>• Leverage free tiers effectively</li>
                  <li>• Right-size infrastructure resources</li>
                  <li>• Implement auto-scaling policies</li>
                  <li>• Use reserved instances for predictable loads</li>
                  <li>• Optimize database queries and indexes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-github-text mb-2">Hidden Costs to Consider</h4>
                <ul className="space-y-1 text-sm text-github-text-secondary">
                  <li>• Developer training and onboarding</li>
                  <li>• Maintenance and updates</li>
                  <li>• Integration development</li>
                  <li>• Data transfer and bandwidth</li>
                  <li>• Backup and disaster recovery</li>
                  <li>• Compliance and security audits</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-github-dark p-4 rounded-lg">
              <h4 className="font-semibold text-github-text mb-2">Cost Monitoring Tips</h4>
              <p className="text-sm text-github-text-secondary">
                Set up billing alerts, use cost allocation tags, review monthly reports, 
                and regularly audit unused resources. Consider using cost management tools 
                to track spending across multiple services.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function TroubleshootingContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4 text-github-text">Troubleshooting</h1>
        <p className="text-lg text-github-text-secondary">
          Solutions to common issues and frequently asked questions
        </p>
      </div>

      <section id="common-issues" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Common Issues</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="search-not-working">
            <AccordionTrigger>Search is not returning expected results</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-github-text-secondary">
                <p><strong>Possible causes:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• Filters may be too restrictive</li>
                  <li>• Search terms may be too specific</li>
                  <li>• Tool may be listed under different name</li>
                </ul>
                <p className="mt-3"><strong>Solutions:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. Clear all filters and search again</li>
                  <li>2. Use broader search terms</li>
                  <li>3. Browse by category instead</li>
                  <li>4. Check alternative tool names or abbreviations</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="compatibility-scores">
            <AccordionTrigger>Compatibility scores seem incorrect</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-github-text-secondary">
                <p>
                  Compatibility scores are calculated based on multiple factors including category alignment, 
                  known integrations, and community feedback. If you believe a score is incorrect:
                </p>
                <ol className="space-y-1 ml-4">
                  <li>1. Check if both tools are in compatible categories</li>
                  <li>2. Review the detailed compatibility breakdown</li>
                  <li>3. Consider version-specific compatibility</li>
                  <li>4. Report the issue with supporting documentation</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="ai-blueprint-issues">
            <AccordionTrigger>AI Blueprint not generating expected results</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-github-text-secondary">
                <p><strong>Tips for better AI results:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• Be specific about your requirements</li>
                  <li>• Include constraints (budget, timeline, team size)</li>
                  <li>• Mention preferred technologies if any</li>
                  <li>• Specify the type of application clearly</li>
                </ul>
                <p className="mt-3">
                  If results are still not satisfactory, try the manual Stack Builder for more control.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="export-import-fail">
            <AccordionTrigger>Export/Import not working</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-github-text-secondary">
                <p><strong>Common export/import issues:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• File format not supported (use JSON or YAML)</li>
                  <li>• File size exceeds limit (max 10MB)</li>
                  <li>• Invalid JSON/YAML syntax</li>
                  <li>• Missing required fields in import</li>
                </ul>
                <p className="mt-3">
                  Validate your JSON/YAML syntax using online validators before importing.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section id="faqs" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Frequently Asked Questions</h2>
        <Card className="bg-github-surface border-github-border">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="faq-1">
                <AccordionTrigger>Is TechStack Explorer free to use?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-github-text-secondary">
                    Yes, TechStack Explorer offers a generous free tier that includes access to the tool database, 
                    basic compatibility checking, and limited AI blueprint generation. 
                    Pro features include unlimited AI generations, API access, and team collaboration.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="faq-2">
                <AccordionTrigger>How often is the tool database updated?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-github-text-secondary">
                    Our tool database is updated continuously. New tools are added weekly, 
                    and existing tool information is refreshed monthly. 
                    Compatibility scores are recalculated as new integration information becomes available.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="faq-3">
                <AccordionTrigger>Can I suggest new tools to be added?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-github-text-secondary">
                    Absolutely! Use the "Add Tool" button in the header to suggest new tools. 
                    Provide as much information as possible, and our team will review and add qualifying tools 
                    to the database within 2-3 business days.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="faq-4">
                <AccordionTrigger>How are compatibility scores calculated?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-github-text-secondary">
                    Compatibility scores are calculated using a proprietary algorithm that considers:
                  </p>
                  <ul className="space-y-1 text-sm text-github-text-secondary mt-2 ml-4">
                    <li>• Category compatibility</li>
                    <li>• Known integrations and plugins</li>
                    <li>• Shared protocols and standards</li>
                    <li>• Community feedback and usage patterns</li>
                    <li>• Technical architecture alignment</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="faq-5">
                <AccordionTrigger>Can I save multiple tech stacks?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-github-text-secondary">
                    Yes, with a free account you can save up to 3 tech stacks. 
                    Pro users can save unlimited stacks and organize them into projects. 
                    You can also export stacks as JSON for external storage.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="faq-6">
                <AccordionTrigger>Is there an API available?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-github-text-secondary">
                    Yes, we provide a RESTful API for Pro and Enterprise users. 
                    The API allows you to query tools, check compatibility, generate AI blueprints, 
                    and integrate TechStack Explorer data into your own applications. 
                    See the API Reference section for details.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <section id="support" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Getting Support</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-github-surface border-github-border hover:border-neon-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Community Forum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-github-text-secondary mb-4">
                Get help from the community, share experiences, and discuss best practices.
              </p>
              <Button variant="outline" className="w-full">
                Visit Forum
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-github-surface border-github-border hover:border-neon-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-400" />
                Discord Server
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-github-text-secondary mb-4">
                Join our Discord for real-time chat with other developers and the TechStack team.
              </p>
              <Button variant="outline" className="w-full">
                Join Discord
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-github-surface border-github-border hover:border-neon-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-github-text-secondary mb-4">
                Pro users can email our support team for personalized assistance.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-github-surface border-github-border hover:border-neon-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-neon-orange" />
                GitHub Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-github-text-secondary mb-4">
                Report bugs and request features on our GitHub repository.
              </p>
              <Button variant="outline" className="w-full">
                Open Issue
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="bug-reporting" className="space-y-4">
        <h2 className="text-2xl font-bold text-github-text">Reporting Bugs</h2>
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <CardTitle>How to Report Bugs Effectively</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-github-text-secondary">
              Help us fix issues quickly by providing detailed bug reports.
            </p>
            
            <div className="bg-github-dark p-4 rounded-lg">
              <h4 className="font-semibold text-github-text mb-2">Include in Your Report:</h4>
              <ol className="space-y-2 text-sm text-github-text-secondary">
                <li>1. <strong>Steps to reproduce:</strong> Exact sequence of actions that cause the bug</li>
                <li>2. <strong>Expected behavior:</strong> What should happen</li>
                <li>3. <strong>Actual behavior:</strong> What actually happens</li>
                <li>4. <strong>Environment:</strong> Browser, OS, screen size</li>
                <li>5. <strong>Screenshots/videos:</strong> Visual evidence if applicable</li>
                <li>6. <strong>Error messages:</strong> Any console errors or warnings</li>
              </ol>
            </div>
            
            <Alert className="bg-green-600/10 border-green-600/30">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-github-text-secondary">
                <strong>Pro Tip:</strong> Check if the issue has already been reported before creating a new bug report.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// Import Alert component
function Alert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 rounded-lg border ${className}`}>
      {children}
    </div>
  );
}

function AlertDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}