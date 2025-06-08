import StatsCards from "@/components/dashboard/stats-cards";
import RecentFiles from "@/components/dashboard/recent-files";
import FileTypesChart from "@/components/dashboard/file-types-chart";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import { useEffect } from "react";

export default function Dashboard() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/file-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/largest-files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    }, 10000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const { data: largestFiles, isLoading: loadingLargest } = useQuery({
    queryKey: ["/api/dashboard/largest-files"],
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
        <p className="text-slate-400">Overview of your files, notes, and storage usage</p>
      </div>
      
      <StatsCards />
      
      {/* Recent Activity & File Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentFiles />
        <FileTypesChart />
      </div>
      
      {/* Largest Files */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Largest Files</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="pb-3 text-sm font-medium text-slate-400">Name</th>
                <th className="pb-3 text-sm font-medium text-slate-400">Type</th>
                <th className="pb-3 text-sm font-medium text-slate-400">Size</th>
                <th className="pb-3 text-sm font-medium text-slate-400">Modified</th>
              </tr>
            </thead>
            <tbody>
              {loadingLargest ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Loading largest files...
                  </td>
                </tr>
              ) : Array.isArray(largestFiles) && largestFiles.length > 0 ? (
                largestFiles.map((file: any) => (
                  <tr key={file.id} className="border-b border-slate-700/50">
                    <td className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-purple-400 text-xs">
                            {file.mimeType.startsWith('video/') ? '🎥' : 
                             file.mimeType.startsWith('image/') ? '🖼️' : '📄'}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{file.originalName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-400 capitalize">
                      {file.mimeType.split('/')[0]}
                    </td>
                    <td className="py-3 text-sm font-medium">{formatBytes(file.size)}</td>
                    <td className="py-3 text-sm text-slate-400">
                      {formatRelativeTime(file.lastModified)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No files found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
