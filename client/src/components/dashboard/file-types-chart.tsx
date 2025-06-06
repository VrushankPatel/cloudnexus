import { useQuery } from "@tanstack/react-query";

export default function FileTypesChart() {
  const { data: fileTypes, isLoading } = useQuery({
    queryKey: ["/api/dashboard/file-types"],
  });

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">File Types</h3>
      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-muted rounded-full" />
                <div className="h-4 bg-muted rounded w-16" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-muted rounded w-12" />
                <div className="h-4 bg-muted rounded w-8" />
              </div>
            </div>
          ))
        ) : fileTypes && fileTypes.length > 0 ? (
          fileTypes.map((type: any) => (
            <div key={type.type} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm text-foreground">{type.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{type.count} files</span>
                <span className="text-sm font-medium text-foreground">{type.percentage}%</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No file data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
