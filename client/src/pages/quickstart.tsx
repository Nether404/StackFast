import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Download, Upload, PlayCircle } from "lucide-react";

export default function QuickStartPage() {
  const queryClient = useQueryClient();

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/seed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/import-csv");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    },
  });

  const genCompatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/generate-compatibility");
      return await res.json();
    },
  });

  const handleDownloadTemplate = async () => {
    const res = await fetch("/api/tools/export-csv");
    const text = await res.text();
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tools-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-github-text">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-github-text">
          <p>Get up and running with curated tool data in a few clicks:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg">1. Seed Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Populate the database with a minimal starter set.</p>
                <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="gap-2">
                  <PlayCircle className="h-4 w-4" /> {seedMutation.isPending ? "Seeding..." : "Seed Database"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg">2. Import Clean CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Load curated tool data from the bundled CSV file.</p>
                <Button onClick={() => importCsvMutation.mutate()} disabled={importCsvMutation.isPending} className="gap-2">
                  <Upload className="h-4 w-4" /> {importCsvMutation.isPending ? "Importing..." : "Import CSV"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg">3. Generate Compatibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Compute compatibility scores for tool pairs.</p>
                <Button onClick={() => genCompatMutation.mutate()} disabled={genCompatMutation.isPending} className="gap-2">
                  <PlayCircle className="h-4 w-4" /> {genCompatMutation.isPending ? "Generating..." : "Generate Compatibility"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="text-lg">4. Download CSV Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Download a CSV template to add your own tools.</p>
                <Button onClick={handleDownloadTemplate} className="gap-2">
                  <Download className="h-4 w-4" /> Download Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


