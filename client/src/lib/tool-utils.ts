/**
 * Utility functions for tool-related operations
 */

import type { ToolWithCategory, CompatibilityMatrix, Compatibility } from "@shared/schema";
import { safeString, isNonEmptyString } from "./type-utils";

/**
 * Get category icon for a given category name
 */
export function getCategoryIcon(categoryName: string): string {
  switch (categoryName.toLowerCase()) {
    case "ai coding tools":
      return "🤖";
    case "frontend/design":
      return "🎨";
    case "backend/database":
      return "🗄️";
    case "payment platforms":
      return "💳";
    default:
      return "🔧";
  }
}

/**
 * Get category color class for a given category name
 */
export function getCategoryColor(categoryName: string): string {
  switch (categoryName.toLowerCase()) {
    case "ai coding tools":
      return "text-neon-orange";
    case "frontend/design":
      return "text-info";
    case "backend/database":
      return "text-success";
    case "payment platforms":
      return "text-warning";
    default:
      return "text-github-text-secondary";
  }
}

/**
 * Get compatibility CSS class based on score
 */
export function getCompatibilityClass(score: number): string {
  if (score >= 90) return "compatibility-high";
  if (score >= 70) return "compatibility-medium";
  if (score >= 50) return "compatibility-low";
  return "compatibility-none";
}

/**
 * Find compatibility between two tools
 */
export function getCompatibilityScore(
  toolOne: ToolWithCategory,
  toolTwo: ToolWithCategory,
  compatibilityMatrix: CompatibilityMatrix[]
): CompatibilityMatrix | null {
  if (toolOne.id === toolTwo.id) return null; // Self-compatibility

  const compatibility = compatibilityMatrix.find(
    (c) =>
      (c.toolOne.id === toolOne.id && c.toolTwo.id === toolTwo.id) ||
      (c.toolOne.id === toolTwo.id && c.toolTwo.id === toolOne.id)
  );

  return compatibility || null;
}

/**
 * Filter tools based on search query and filters
 */
export function filterTools(
  tools: ToolWithCategory[],
  searchQuery: string,
  filters: {
    category: string;
    compatibility: string;
    maturity: string;
  }
): ToolWithCategory[] {
  return tools.filter((tool) => {
    // Search filter
    if (isNonEmptyString(searchQuery)) {
      const query = searchQuery.toLowerCase();
      const name = safeString(tool.name).toLowerCase();
      const description = safeString(tool.description).toLowerCase();
      
      if (!name.includes(query) && !description.includes(query)) {
        return false;
      }
    }

    // Category filter
    if (filters.category !== "all") {
      const categorySlug = safeString(tool.category.name).toLowerCase().replace(/[^a-z]/g, "-");
      if (filters.category !== categorySlug) {
        return false;
      }
    }

    // Maturity filter
    if (filters.maturity !== "all") {
      const maturityScore = tool.maturityScore || 0;
      if (filters.maturity === "mature" && maturityScore < 8.0) return false;
      if (filters.maturity === "stable" && (maturityScore < 6.0 || maturityScore >= 8.0)) return false;
      if (filters.maturity === "beta" && maturityScore >= 6.0) return false;
    }

    return true;
  });
}

/**
 * Truncate text with ellipsis if it exceeds max length
 */
export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}