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

  const httpServer = createServer(app);
  return httpServer;
}