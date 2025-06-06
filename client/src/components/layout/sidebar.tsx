import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderOpen, 
  StickyNote, 
  FileText,
  Archive,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Files", href: "/files", icon: FolderOpen },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "PDF Viewer", href: "/pdf-viewer", icon: FileText },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:block",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Archive className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">Cloud Hub</h1>
            </div>
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-accent-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                    onClick={handleLinkClick}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-8 pt-8 border-t border-sidebar-border">
            <div className="px-3 py-2 text-sm text-sidebar-accent-foreground">
              <div className="flex justify-between items-center mb-2">
                <span>Storage Used</span>
                <span>{stats?.storageUsage?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-sidebar-accent rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${stats?.storageUsage?.percentage || 0}%` }}
                />
              </div>
              <div className="mt-1 text-xs">
                {stats?.storageUsed || "0 B"} of 3 GB used
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
