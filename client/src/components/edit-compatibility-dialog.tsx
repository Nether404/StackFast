import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Compatibility, ToolWithCategory } from "@shared/schema";

interface EditCompatibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compatibility: Compatibility | null;
  toolOne: ToolWithCategory;
  toolTwo: ToolWithCategory;
}

export function EditCompatibilityDialog({ 
  open, 
  onOpenChange, 
  compatibility, 
  toolOne, 
  toolTwo 
}: EditCompatibilityDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    compatibilityScore: compatibility?.compatibilityScore || 50,
    notes: compatibility?.notes || "",
    verifiedIntegration: compatibility?.verifiedIntegration === 1,
    integrationDifficulty: compatibility?.integrationDifficulty || "medium",
    setupSteps: compatibility?.setupSteps || [],
    codeExample: compatibility?.codeExample || "",
    dependencies: compatibility?.dependencies || [],
  });

  useEffect(() => {
    if (compatibility) {
      setFormData({
        compatibilityScore: compatibility.compatibilityScore,
        notes: compatibility.notes || "",
        verifiedIntegration: compatibility.verifiedIntegration === 1,
        integrationDifficulty: compatibility.integrationDifficulty || "medium",
        setupSteps: compatibility.setupSteps || [],
        codeExample: compatibility.codeExample || "",
        dependencies: compatibility.dependencies || [],
      });
    } else {
      // Reset form for new compatibility
      setFormData({
        compatibilityScore: 50,
        notes: "",
        verifiedIntegration: false,
        integrationDifficulty: "medium",
        setupSteps: [],
        codeExample: "",
        dependencies: [],
      });
    }
  }, [compatibility, open]);

  const updateCompatibility = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        verifiedIntegration: data.verifiedIntegration ? 1 : 0,
        setupSteps: data.setupSteps.filter(step => step.trim() !== ""),
        dependencies: data.dependencies.filter(dep => dep.trim() !== ""),
      };

      if (compatibility) {
        // Update existing compatibility
        return apiRequest(`/api/compatibilities/${compatibility.id}`, "PUT", payload);
      } else {
        // Create new compatibility
        return apiRequest("/api/compatibilities", "POST", {
          ...payload,
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: compatibility ? "Compatibility updated" : "Compatibility created",
        description: `The compatibility between ${toolOne.name} and ${toolTwo.name} has been ${compatibility ? 'updated' : 'created'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/compatibility-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compatibilities"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to ${compatibility ? 'update' : 'create'} compatibility. Please try again.`,
        variant: "destructive",
      });
      console.error("Compatibility update error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.compatibilityScore < 0 || formData.compatibilityScore > 100) {
      toast({
        title: "Invalid score",
        description: "Compatibility score must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    updateCompatibility.mutate(formData);
  };

  const handleSetupStepsChange = (value: string) => {
    const steps = value.split('\n').filter(step => step.trim() !== '');
    setFormData({ ...formData, setupSteps: steps });
  };

  const handleDependenciesChange = (value: string) => {
    const deps = value.split('\n').filter(dep => dep.trim() !== '');
    setFormData({ ...formData, dependencies: deps });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {compatibility ? "Edit" : "Create"} Compatibility
            </DialogTitle>
            <DialogDescription>
              {compatibility ? "Update" : "Define"} the compatibility between {toolOne.name} and {toolTwo.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="score" className="text-right">
                Score (0-100) *
              </Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.compatibilityScore}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  compatibilityScore: parseInt(e.target.value) || 0 
                })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Integration Difficulty
              </Label>
              <Select
                value={formData.integrationDifficulty}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  integrationDifficulty: value as "easy" | "medium" | "hard" 
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="verified" className="text-right">
                Verified Integration
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="verified"
                  checked={formData.verifiedIntegration}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    verifiedIntegration: checked 
                  })}
                />
                <Label htmlFor="verified" className="text-sm text-muted-foreground">
                  Mark as verified if integration has been tested
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="col-span-3"
                placeholder="Additional notes about the compatibility..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="setupSteps" className="text-right">
                Setup Steps
              </Label>
              <Textarea
                id="setupSteps"
                value={formData.setupSteps.join('\n')}
                onChange={(e) => handleSetupStepsChange(e.target.value)}
                className="col-span-3"
                placeholder="Enter each setup step on a new line..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dependencies" className="text-right">
                Dependencies
              </Label>
              <Textarea
                id="dependencies"
                value={formData.dependencies.join('\n')}
                onChange={(e) => handleDependenciesChange(e.target.value)}
                className="col-span-3"
                placeholder="Enter each dependency on a new line..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codeExample" className="text-right">
                Code Example
              </Label>
              <Textarea
                id="codeExample"
                value={formData.codeExample}
                onChange={(e) => setFormData({ ...formData, codeExample: e.target.value })}
                className="col-span-3 font-mono text-sm"
                placeholder="// Example integration code..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCompatibility.isPending}>
              {updateCompatibility.isPending 
                ? (compatibility ? "Updating..." : "Creating...") 
                : (compatibility ? "Update" : "Create")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}