import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ToolWithCategory } from "@shared/schema";

interface PaginatedToolsResult {
  tools: ToolWithCategory[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
}

interface PaginatedResponse {
  tools: ToolWithCategory[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function usePaginatedTools(limit: number = 20): PaginatedToolsResult {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["/api/tools/paginated", currentPage, limit],
    queryFn: async () => {
      const response = await fetch(`/api/tools/paginated?page=${currentPage}&limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch tools");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= (data?.pagination.totalPages || 1)) {
      setCurrentPage(page);
    }
  };
  
  const nextPage = () => {
    if (data?.pagination.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const previousPage = () => {
    if (data?.pagination.hasPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  return {
    tools: data?.tools || [],
    currentPage,
    totalPages: data?.pagination.totalPages || 0,
    totalCount: data?.pagination.totalCount || 0,
    isLoading,
    error: error as Error | null,
    goToPage,
    nextPage,
    previousPage,
  };
}