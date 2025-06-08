import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Grid, List, Plus, Search } from "lucide-react";
import FileGrid from "@/components/files/file-grid";
import UploadModal from "@/components/files/upload-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Files() {
  const [currentParentId, setCurrentParentId] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: files, isLoading } = useQuery({
    queryKey: ["/api/files", currentParentId],
    queryFn: async () => {
      const url = currentParentId 
        ? `/api/files?parentId=${currentParentId}`
        : "/api/files";
      const response = await fetch(url);
      return response.json();
    },
  });

  // WebSocket: Listen for file changes and update files/dashboard metrics
  useEffect(() => {
    const ws = new window.WebSocket(`ws://localhost:5050`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'filesChanged') {
          queryClient.invalidateQueries({ queryKey: ["/api/files"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-files"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/file-types"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/largest-files"] });
        }
      } catch {}
    };
    return () => ws.close();
  }, [queryClient]);

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/files/folder", {
        name,
        parentId: currentParentId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setNewFolderName("");
      setShowNewFolder(false);
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
  };

  const handleFolderClick = (folderId: number) => {
    setCurrentParentId(folderId);
  };

  const handleBackClick = () => {
    setCurrentParentId(undefined);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Files</h2>
            <p className="text-muted-foreground">Manage your files and folders</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
        
        {/* File Actions Bar */}
        <div className="flex items-center justify-between bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center space-x-4">
            {showNewFolder ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-48"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") setShowNewFolder(false);
                  }}
                />
                <Button size="sm" onClick={handleCreateFolder}>
                  Create
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowNewFolder(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowNewFolder(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            )}
            
            {currentParentId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
              >
                ← Back
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <FileGrid
        files={files || []}
        viewMode={viewMode}
        isLoading={isLoading}
        onFolderClick={handleFolderClick}
      />

      <UploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal}
        parentId={currentParentId}
      />
    </div>
  );
}
