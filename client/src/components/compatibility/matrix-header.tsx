/**
 * Header component for the compatibility matrix
 */

import { CardHeader, CardTitle } from "@/components/ui/card";
import { MatrixLegend } from "./matrix-legend";

export function MatrixHeader() {
  return (
    <CardHeader className="border-b border-github-border">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-github-text" data-testid="matrix-title">
            Tool Compatibility Matrix
          </CardTitle>
          <p className="text-sm text-github-text-secondary mt-1">
            Interactive visualization of tool compatibility across tech stack categories
          </p>
        </div>

        <MatrixLegend />
      </div>
    </CardHeader>
  );
}