import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";

interface AddToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToolDialog({ open, onOpenChange }: AddToolDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    url: "",
    pricing: "",
    notes: "",
    popularityScore: 5,
    maturityScore: 5,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const createTool = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/tools", "POST", {
        ...data,
        frameworks: [],
        languages: [],
        features: [],
        integrations: [],
      });
    },
    onSuccess: () => {
      toast({
        title: "Tool created",
        description: "The new tool has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tools/quality"] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tool. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      url: "",
      pricing: "",
      notes: "",
      popularityScore: 5,
      maturityScore: 5,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.categoryId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createTool.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Tool</DialogTitle>
            <DialogDescription>
              Add a new development tool to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories as any[]).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="col-span-3"
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricing" className="text-right">
                Pricing
              </Label>
              <Input
                id="pricing"
                value={formData.pricing}
                onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                className="col-span-3"
                placeholder="Free tier, Pro $20/month"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="popularity" className="text-right">
                Popularity (0-10)
              </Label>
              <Input
                id="popularity"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.popularityScore}
                onChange={(e) => setFormData({ ...formData, popularityScore: parseFloat(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maturity" className="text-right">
                Maturity (0-10)
              </Label>
              <Input
                id="maturity"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.maturityScore}
                onChange={(e) => setFormData({ ...formData, maturityScore: parseFloat(e.target.value) })}
                className="col-span-3"
              />
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
                placeholder="Additional information about the tool"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTool.isPending}>
              {createTool.isPending ? "Creating..." : "Create Tool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}