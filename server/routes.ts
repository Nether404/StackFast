import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Basic health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get all tools
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getToolsWithAllCategories();
      res.json(tools);
    } catch (error) {
      console.error("Get tools error:", error);
      res.status(500).json({ message: "Failed to get tools" });
    }
  });

  // Get quality tools only - must be before :id route
  app.get("/api/tools/quality", async (req, res) => {
    try {
      const tools = await storage.getToolsWithAllCategories();
      
      // Define patterns for non-tools
      const languageNames = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Perl', 'Scala', 'Haskell', 'Clojure', 'Elixir', 'Dart', 'R', 'Julia', 'Lua', 'MATLAB'];
      const resourcePatterns = ['awesome-', 'free-', '-books', 'book', 'tutorial', 'course', 'interview', 'roadmap', 'study', 'learning', 'education', 'curriculum', 'algorithms', 'design-patterns', 'cheat-sheet', 'collection', 'list-of', 'resources'];
      
      const qualityTools = tools
        .filter(tool => {
          // Must have meaningful description
          if (!tool.description || tool.description.length < 20) return false;
          
          const nameLower = tool.name.toLowerCase();
          const descLower = tool.description.toLowerCase();
          
          // Exclude programming languages
          if (languageNames.some(lang => tool.name === lang || nameLower === lang.toLowerCase())) {
            return false;
          }
          
          // Exclude resource collections, books, tutorials
          if (resourcePatterns.some(pattern => 
            nameLower.includes(pattern) || 
            (pattern.length > 4 && descLower.includes(pattern))
          )) {
            return false;
          }
          
          // Exclude items that are clearly collections or lists
          if (descLower.includes('collection of') || 
              descLower.includes('list of') || 
              descLower.includes('awesome list') ||
              descLower.includes('freely available') ||
              descLower.includes('all algorithms')) {
            return false;
          }
          
          return true;
        })
        .sort((a, b) => {
          // Prioritize tools with more features and better descriptions
          const scoreA = (a.features?.length || 0) * 2 + (a.description?.length || 0) / 10;
          const scoreB = (b.features?.length || 0) * 2 + (b.description?.length || 0) / 10;
          return scoreB - scoreA;
        });
        
      res.json(qualityTools);
    } catch (error) {
      console.error("Get quality tools error:", error);
      res.status(500).json({ message: "Failed to get quality tools" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getToolCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Get compatibility matrix
  app.get("/api/compatibility-matrix", async (req, res) => {
    try {
      const matrix = await storage.getCompatibilityMatrix();
      res.json(matrix);
    } catch (error) {
      console.error("Get compatibility matrix error:", error);
      res.status(500).json({ message: "Failed to get compatibility matrix" });
    }
  });

  // Export tools as CSV
  app.get("/api/tools/export-csv", async (req, res) => {
    try {
      const csv = await storage.exportToolsAsCSV();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=tools.csv");
      res.send(csv);
    } catch (error) {
      console.error("Export tools CSV error:", error);
      res.status(500).json({ message: "Failed to export tools CSV" });
    }
  });

  // Seed database route
  app.post("/api/tools/seed", async (req, res) => {
    try {
      res.json({ message: "Seed not needed for MemStorage" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed database", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}