import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Download, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes, formatRelativeTime, getFileIcon, getFileTypeColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";

interface FileGridProps {
  files: File[];
  viewMode: "grid" | "list";
  isLoading: boolean;
  onFolderClick: (folderId: number) => void;
}

export default function FileGrid({ files, viewMode, isLoading, onFolderClick }: FileGridProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleFileClick = (file: File) => {
    if (file.isFolder) {
      onFolderClick(file.id);
    } else {
      // Handle file preview/download
      if (file.path) {
        window.open(`/uploads/${file.name}`, '_blank');
      }
    }
  };

  const handleDelete = (fileId: number) => {
    deleteMutation.mutate(fileId);
  };

  if (isLoading) {
    return (
      <div className={viewMode === "grid" ? "file-grid" : "space-y-4"}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-slate-700 rounded-lg" />
              <div className="w-4 h-4 bg-slate-700 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
              <div className="h-3 bg-slate-700 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📁</span>
        </div>
        <h3 className="text-lg font-medium mb-2">No files yet</h3>
        <p className="text-slate-400 mb-4">Upload some files to get started</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center space-x-4 p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-all"
            onClick={() => handleFileClick(file)}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileTypeColor(file.mimeType)}`}>
              <span className="text-lg">{getFileIcon(file.mimeType)}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{file.originalName}</h3>
              <p className="text-xs text-slate-400">
                {file.isFolder ? "Folder" : formatBytes(file.size)} • {formatRelativeTime(file.lastModified)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="w-4 h-4 mr-2" />
                  Add to Favorites
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-400"
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="file-grid">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer transition-all hover:shadow-lg"
          onClick={() => handleFileClick(file)}
        >
          {/* Image preview for image files */}
          {file.mimeType.startsWith('image/') && file.path && (
            <img
              src={`/uploads/thumbnail/${file.name}`}
              alt={file.originalName}
              className="w-full h-32 object-cover rounded-t-xl"
              loading="lazy"
              onError={(e) => {
                // Fallback to file icon if thumbnail fails
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileTypeColor(file.mimeType)}`}>
                <span className="text-lg">{getFileIcon(file.mimeType)}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="w-4 h-4 mr-2" />
                    Add to Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-400"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <h3 className="font-medium text-sm mb-1 truncate">{file.originalName}</h3>
            <p className="text-xs text-slate-400">
              {file.isFolder ? "Folder" : formatBytes(file.size)}
            </p>
            <p className="text-xs text-slate-400">
              Modified {formatRelativeTime(file.lastModified)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
