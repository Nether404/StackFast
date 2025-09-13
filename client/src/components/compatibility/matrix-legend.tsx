/**
 * Legend component for the compatibility matrix
 */

interface MatrixLegendProps {
  className?: string;
}

export function MatrixLegend({ className = "" }: MatrixLegendProps) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full compatibility-high" data-testid="legend-high"></div>
        <span className="text-xs text-github-text-secondary">High (90-100%)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full compatibility-medium" data-testid="legend-medium"></div>
        <span className="text-xs text-github-text-secondary">Medium (70-89%)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full compatibility-low" data-testid="legend-low"></div>
        <span className="text-xs text-github-text-secondary">Low (50-69%)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full compatibility-none" data-testid="legend-none"></div>
        <span className="text-xs text-github-text-secondary">None (&lt;50%)</span>
      </div>
    </div>
  );
}