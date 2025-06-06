import { useQuery } from "@tanstack/react-query";
import { getFileIcon, getFileTypeColor } from "@/lib/utils";

export default function RecentFiles() {
  const { data: recentFiles, isLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-files"],
  });

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Files</h3>
      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
              <div className="h-3 bg-muted rounded w-12" />
            </div>
          ))
        ) : recentFiles && recentFiles.length > 0 ? (
          recentFiles.map((file: any) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileTypeColor(file.mimeType)}`}>
                <span className="text-lg">{getFileIcon(file.mimeType)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.uploadTime}</p>
              </div>
              <span className="text-xs text-muted-foreground">{file.size}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent files</p>
          </div>
        )}
      </div>
    </div>
  );
}
