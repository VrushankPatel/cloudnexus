import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut } from "lucide-react";
import type { File } from "@shared/schema";

interface PDFViewerProps {
  file: File;
}

export default function PDFViewerComponent({ file }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState("100");
  const [searchTerm, setSearchTerm] = useState("");

  const totalPages = (file.metadata as any)?.pages || 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleZoomChange = (value: string) => {
    setZoom(value);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 h-[800px] flex flex-col">
      {/* PDF Viewer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-400">Page</span>
          <Input
            type="number"
            value={currentPage}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            min={1}
            max={totalPages}
            className="w-16 text-center"
          />
          <span className="text-sm text-slate-400">of {totalPages}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-slate-700 mx-2" />
          
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search in PDF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-slate-700 mx-2" />
          
          <Button variant="ghost" size="sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Select value={zoom} onValueChange={handleZoomChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="125">125%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
              <SelectItem value="200">200%</SelectItem>
              <SelectItem value="fit-width">Fit Width</SelectItem>
              <SelectItem value="fit-page">Fit Page</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* PDF Content Area */}
      <div className="flex-1 p-4 bg-slate-900 overflow-auto">
        <div className="bg-white mx-auto max-w-2xl min-h-full rounded shadow-lg p-8">
          {/* This would be replaced with actual PDF rendering */}
          <div className="text-black">
            <h1 className="text-2xl font-bold mb-6 text-center">
              {(file.metadata as any)?.title || file.originalName}
            </h1>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                This is a placeholder for PDF content. In a real implementation, you would use a library like PDF.js or react-pdf to render the actual PDF content.
              </p>
              <p className="text-sm leading-relaxed">
                The PDF viewer would display the actual pages of the document, allow navigation between pages, search functionality, and zoom controls.
              </p>
              <p className="text-sm leading-relaxed">
                Currently showing page {currentPage} of {totalPages} at {zoom}% zoom.
              </p>
              {searchTerm && (
                <div className="bg-yellow-100 p-3 rounded border">
                  <p className="text-sm">
                    <strong>Search:</strong> "{searchTerm}" - This would highlight matches in the actual PDF content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
