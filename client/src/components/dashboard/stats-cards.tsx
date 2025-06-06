import { useQuery } from "@tanstack/react-query";
import { FolderOpen, StickyNote, HardDrive, Upload } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const cards = [
    {
      title: "Total Files",
      value: stats?.totalFiles || 0,
      icon: FolderOpen,
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Notes",
      value: stats?.totalNotes || 0,
      icon: StickyNote,
      color: "bg-emerald-500/20 text-emerald-400",
    },
    {
      title: "Storage Used",
      value: stats?.storageUsed || "0 B",
      icon: HardDrive,
      color: "bg-amber-500/20 text-amber-400",
    },
    {
      title: "This Week",
      value: stats?.weeklyUploads || 0,
      icon: Upload,
      color: "bg-purple-500/20 text-purple-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div key={card.title} className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{card.title}</p>
              <p className="text-2xl font-semibold text-foreground">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
