# StackFast - AI Tool Compatibility Matrix

## Overview

StackFast is a comprehensive platform that analyzes compatibility between AI development tools and generates intelligent tech stack recommendations. The platform successfully merged StackFast's compatibility matrix capabilities with StackFast's blueprint generation system, creating a unique value proposition that provides both tool discovery and AI-powered stack planning.

The system maintains a curated database of development tools with intelligent compatibility scoring, offers interactive visualizations including heatmaps and migration wizards, and provides AI-powered blueprint generation that considers tool compatibility when recommending tech stacks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI with shadcn/ui styling for accessible, consistent design
- **Styling**: Tailwind CSS with CSS variables, featuring neon orange accent (#FF4500) and GitHub-inspired dark theme
- **State Management**: TanStack Query for server state management, caching, and optimistic updates
- **Build System**: Vite for fast development and optimized production builds
- **Design System**: Mobile-first responsive design with consistent component patterns

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules for modern JavaScript features
- **API Design**: RESTful API with structured route handlers and comprehensive error handling
- **Data Abstraction**: Storage interface pattern allowing for database flexibility
- **Validation**: Zod schemas for request/response validation and type safety
- **Security**: CORS, rate limiting, and input sanitization

### Data Layer Architecture
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Normalized structure with `tools`, `toolCategories`, `compatibilities`, and junction tables
- **Data Types**: JSONB fields for flexible array storage (frameworks, languages, features)
- **Migration Strategy**: Drizzle Kit for version-controlled schema migrations

### Compatibility Engine
- **Scoring Algorithm**: Multi-factor analysis considering categories, frameworks, languages, and integrations
- **Intelligence**: Automated compatibility generation based on tool metadata and category-based rules
- **Matrix Generation**: Optimized performance for displaying thousands of tool relationships
- **Validation**: Quality filtering to exclude non-tools (programming languages, books, resource collections)

### AI Integration
- **Blueprint Generation**: AI-powered tech stack recommendations using external AI services
- **Tool Analysis**: Intelligent categorization and feature extraction from tool descriptions
- **Compatibility Intelligence**: AI-enhanced scoring that considers real-world integration patterns
- **Migration Planning**: Automated step-by-step migration paths between tools

### Visualization Components
- **Interactive Matrix**: Color-coded compatibility visualization with hover details
- **Heatmap**: Visual representation of tool relationships with performance optimization
- **Migration Wizard**: Step-by-step planning interface with difficulty assessment and time estimates
- **Analytics Dashboard**: Statistical insights and trend analysis

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling and auto-scaling
- **Drizzle ORM**: Type-safe database toolkit with schema migrations and query building

### AI Services Integration
- **Blueprint Generation API**: External AI service for generating tech stack recommendations from natural language input
- **Tool Analysis Services**: AI-powered tool categorization and compatibility analysis

### Development Tools
- **Vite**: Frontend build tool with hot module replacement and optimized bundling
- **TypeScript**: Static type checking across frontend and backend
- **Radix UI**: Headless component library for accessible UI primitives
- **TanStack Query**: Server state management with caching and synchronization

### Runtime Environment
- **Node.js**: Server runtime with Express.js framework
- **Replit Infrastructure**: Development and deployment platform with WebSocket support for real-time features

### External Data Sources
- **GitHub API**: Tool repository information and popularity metrics
- **npm Registry**: Package ecosystem data and integration information
- **Product Hunt API**: Tool discovery and community metrics
- **Back4App Database**: Curated developer tools database for enhanced tool profiles