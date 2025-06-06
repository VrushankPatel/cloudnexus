import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Monitor, 
  Moon, 
  Sun, 
  HardDrive, 
  Bell, 
  Download,
  Upload,
  Trash2,
  Info
} from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState("50");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files } = useQuery({
    queryKey: ["/api/files"],
  });

  const { data: notes } = useQuery({
    queryKey: ["/api/notes"],
  });

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    localStorage.clear();
    queryClient.clear();
    toast({
      title: "Cache cleared",
      description: "Browser cache and local storage have been cleared",
    });
    window.location.reload();
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        settings: { 
          theme, 
          notifications, 
          autoSave, 
          compressionEnabled, 
          maxFileSize 
        },
        files: files || [],
        notes: notes || []
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloud-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported",
        description: "Your data has been successfully exported",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.files && !importData.notes) {
        throw new Error("Invalid backup file format");
      }

      // Import settings
      if (importData.settings) {
        if (importData.settings.theme) setTheme(importData.settings.theme);
        if (typeof importData.settings.notifications === 'boolean') {
          setNotifications(importData.settings.notifications);
        }
        if (typeof importData.settings.autoSave === 'boolean') {
          setAutoSave(importData.settings.autoSave);
        }
        if (typeof importData.settings.compressionEnabled === 'boolean') {
          setCompressionEnabled(importData.settings.compressionEnabled);
        }
        if (importData.settings.maxFileSize) {
          setMaxFileSize(importData.settings.maxFileSize);
        }
      }

      toast({
        title: "Data imported",
        description: "Settings have been restored from backup",
      });
      
      queryClient.invalidateQueries();
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Invalid backup file or corrupted data",
        variant: "destructive",
      });
    }
    
    // Reset file input
    event.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your CloudNexus experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Appearance
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* File Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              File Management
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save">Auto-save notes</Label>
                <Switch
                  id="auto-save"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compression">Enable file compression</Label>
                <Switch
                  id="compression"
                  checked={compressionEnabled}
                  onCheckedChange={setCompressionEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="max-size">Max file size (MB)</Label>
                <Select value={maxFileSize} onValueChange={setMaxFileSize}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable notifications</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Management</h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              
              <Button
                variant="outline"
                onClick={handleImportData}
                className="w-full justify-start"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
              
              <Button
                variant="outline"
                onClick={handleClearCache}
                className="w-full justify-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <Separator />

          {/* About */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Info className="w-5 h-5" />
              About
            </h3>
            <div className="text-sm text-slate-400 space-y-1">
              <p>CloudNexus v1.0.0</p>
              <p>A minimalist file storage and note-taking platform</p>
              <p className="text-xs">Built with React, TypeScript, and Express</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}