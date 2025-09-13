-- Add indexes for frequently queried columns
-- These indexes will significantly improve query performance for common operations

-- Index on tools.name for name-based searches and lookups
CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name);

-- Index on tools.category_id for category-based filtering
CREATE INDEX IF NOT EXISTS idx_tools_category_id ON tools(category_id);

-- Index on compatibilities.tool_one_id for compatibility lookups
CREATE INDEX IF NOT EXISTS idx_compatibilities_tool_one_id ON compatibilities(tool_one_id);

-- Index on compatibilities.tool_two_id for compatibility lookups
CREATE INDEX IF NOT EXISTS idx_compatibilities_tool_two_id ON compatibilities(tool_two_id);

-- Composite index for compatibility pair lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_compatibilities_tool_pair ON compatibilities(tool_one_id, tool_two_id);

-- Index on tools.maturity_score for sorting and filtering by quality
CREATE INDEX IF NOT EXISTS idx_tools_maturity_score ON tools(maturity_score);

-- Index on tools.popularity_score for sorting and filtering by popularity
CREATE INDEX IF NOT EXISTS idx_tools_popularity_score ON tools(popularity_score);

-- Index on tool_category_junction for many-to-many relationships
CREATE INDEX IF NOT EXISTS idx_tool_category_junction_tool_id ON tool_category_junction(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_category_junction_category_id ON tool_category_junction(category_id);

-- Composite index for primary category lookups
CREATE INDEX IF NOT EXISTS idx_tool_category_junction_primary ON tool_category_junction(tool_id, is_primary) WHERE is_primary = true;