import { useState, useEffect, useRef } from "react";
import { Search, Upload, Settings, Menu, File, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import UploadModal from "@/components/files/upload-modal";
import SettingsModal from "@/components/layout/settings-modal";
import { getFileIcon } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults } = useQuery({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { files: [], notes: [] };
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  useEffect(() => {
    setShowSearchResults(searchQuery.trim().length > 0);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="relative" ref={searchRef}>
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search files and notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
                className="w-72 md:w-96 pl-10 bg-input border-border text-foreground placeholder-muted-foreground focus:ring-primary focus:border-primary"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {searchResults.files?.length === 0 && searchResults.notes?.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No results found for "{searchQuery}"
                    </div>
                  ) : (
                    <>
                      {searchResults.files?.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Files</div>
                          {searchResults.files.map((file: any) => (
                            <Link
                              key={file.id}
                              href={"/files"}
                              className="flex items-center space-x-3 px-2 py-2 hover:bg-muted rounded-md"
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery("");
                              }}
                            >
                              <div className="w-8 h-8 flex items-center justify-center">
                                <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{file.size} bytes</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {searchResults.notes?.length > 0 && (
                        <div className="p-2 border-t border-border">
                          <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Notes</div>
                          {searchResults.notes.map((note: any) => (
                            <Link
                              key={note.id}
                              href="/notes"
                              className="flex items-center space-x-3 px-2 py-2 hover:bg-muted rounded-md"
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery("");
                              }}
                            >
                              <div className="w-8 h-8 flex items-center justify-center">
                                <StickyNote className="w-5 h-5 text-yellow-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{note.title || "Untitled"}</p>
                                <p className="text-xs text-muted-foreground truncate">{note.content}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <UploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal}
      />
      
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal}
      />
    </>
  );
}
