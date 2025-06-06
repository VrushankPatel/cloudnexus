import { Download, Share, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import type { File } from "@shared/schema";

interface PDFMetadataProps {
  file: File;
}

export default function PDFMetadata({ file }: PDFMetadataProps) {
  const metadata = file.metadata as any;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Document Info</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Title</label>
            <p className="font-medium">{metadata?.title || file.originalName}</p>
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Author</label>
            <p className="font-medium">{metadata?.author || "Unknown"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Pages</label>
              <p className="font-medium">{metadata?.pages || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Size</label>
              <p className="font-medium">{formatBytes(file.size)}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Created</label>
            <p className="font-medium">{formatRelativeTime(file.uploadDate)}</p>
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Modified</label>
            <p className="font-medium">{formatRelativeTime(file.lastModified)}</p>
          </div>
          
          {metadata?.wordCount && (
            <div>
              <label className="text-sm text-slate-400">Word Count (Estimated)</label>
              <p className="font-medium">~{metadata.wordCount} words</p>
            </div>
          )}
        </div>
      </div>
      
      {/* PDF Actions */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        <div className="space-y-3">
          <Button className="w-full justify-start" variant="secondary">
            <Download className="w-4 h-4 mr-3 text-blue-400" />
            Download
          </Button>
          
          <Button className="w-full justify-start" variant="secondary">
            <Share className="w-4 h-4 mr-3 text-emerald-400" />
            Share
          </Button>
          
          <Button className="w-full justify-start" variant="secondary">
            <Star className="w-4 h-4 mr-3 text-amber-400" />
            Add to Favorites
          </Button>
        </div>
      </div>
    </div>
  );
}
