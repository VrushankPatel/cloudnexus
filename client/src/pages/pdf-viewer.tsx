import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PDFMetadata from "@/components/pdf/pdf-metadata";
import PDFViewerComponent from "@/components/pdf/pdf-viewer";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import UploadModal from "@/components/files/upload-modal";

export default function PDFViewer() {
  const { id } = useParams();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: file, isLoading } = useQuery({
    queryKey: [`/api/files/${id}`],
    enabled: !!id,
  });

  const { data: pdfFiles } = useQuery({
    queryKey: ["/api/files"],
    select: (files: any[]) => files?.filter(f => f.mimeType === 'application/pdf') || [],
  });

  const currentFile = file || (pdfFiles && pdfFiles[0]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">PDF Viewer</h2>
            <p className="text-slate-400">View and analyze PDF documents</p>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
        </div>
      </div>
      
      {currentFile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Metadata Panel */}
          <div className="lg:col-span-1">
            <PDFMetadata file={currentFile} />
          </div>
          
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <PDFViewerComponent file={currentFile} />
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading PDF...</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="text-lg font-medium mb-2">No PDF selected</h3>
          <p className="text-slate-400 mb-4">Upload a PDF to get started</p>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
        </div>
      )}

      <UploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal}
      />
    </div>
  );
}
