/**
 * Loading state component for the compatibility matrix
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MatrixLoading() {
  return (
    <Card className="bg-github-surface border-github-border">
      <CardHeader>
        <CardTitle className="text-github-text">Loading Compatibility Matrix...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="loading-shimmer h-12 rounded bg-github-border" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}