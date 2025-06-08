import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, insertNoteSchema } from "@shared/schema";
import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import { files as fileSchema, type File } from '@shared/schema';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "data", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // On startup, clean up missing files
  await removeMissingFilesFromJson();
  // Periodically clean up every 5 minutes
  setInterval(removeMissingFilesFromJson, 5 * 60 * 1000);

  // Periodic cleanup: remove missing files from files.json every 10 seconds
  const DATA_DIR = path.join(process.cwd(), 'data');
  const FILES_PATH = path.join(DATA_DIR, 'files.json');
  function periodicFileCleanup() {
    setInterval(() => {
      let files: File[] = [];
      try {
        files = JSON.parse(fs.readFileSync(FILES_PATH, 'utf-8'));
      } catch {}
      const existingFiles = files.filter(f => f.isFolder || (f.path && fs.existsSync(f.path)));
      if (existingFiles.length !== files.length) {
        fs.writeFileSync(FILES_PATH, JSON.stringify(existingFiles, null, 2));
        console.log(`[CLEANUP] Removed ${files.length - existingFiles.length} missing files from files.json`);
      }
    }, 10 * 1000);
  }
  periodicFileCleanup();

  // Files endpoints
  app.get("/api/files", async (req, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;
      const files = await storage.getFiles(parentId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.get("/api/files/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      const files = await storage.searchFiles(query);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to search files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  app.post("/api/files/upload", (req: Request, res: Response, next: NextFunction) => {
    upload.array("files")(req, res, function (err: any) {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "File too large. Max size is 200MB." });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: "Failed to upload files" });
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const parentId = req.body.parentId ? Number(req.body.parentId) : undefined;
      const uploadedFiles = [];
      for (const file of files) {
        let metadata = null;
        if (file.mimetype === 'application/pdf') {
          try {
            metadata = { pages: null, title: null, author: null, wordCount: null };
          } catch (error) {
            console.error("Failed to extract PDF metadata:", error);
          }
        }
        const fileData = {
          name: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          mimeType: file.mimetype,
          isFolder: false,
          parentId,
          metadata
        };
        const validatedData = insertFileSchema.parse(fileData);
        const savedFile = await storage.createFile(validatedData);
        uploadedFiles.push(savedFile);
      }
      res.json(uploadedFiles);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  app.post("/api/files/folder", async (req, res) => {
    try {
      const { name, parentId } = req.body;
      
      const folderData = {
        name,
        originalName: name,
        path: "",
        size: 0,
        mimeType: "application/folder",
        isFolder: true,
        parentId: parentId ? Number(parentId) : undefined,
        metadata: null
      };

      const validatedData = insertFileSchema.parse(folderData);
      const folder = await storage.createFile(validatedData);
      res.json(folder);
    } catch (error) {
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates = req.body;
      const updatedFile = await storage.updateFile(id, updates);
      if (!updatedFile) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Delete physical file if it exists
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const deleted = await storage.deleteFile(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Notes endpoints
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      const notes = await storage.searchNotes(query);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to search notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData);
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates = req.body;
      const updatedNote = await storage.updateNote(id, updates);
      if (!updatedNote) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteNote(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Search endpoints
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json({ files: [], notes: [] });
      }

      const files = await storage.searchFiles(query.trim());
      const notes = await storage.searchNotes(query.trim());
      
      res.json({ files, notes });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Analytics endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/file-types", async (req, res) => {
    try {
      const fileTypes = await storage.getFileTypeStats();
      res.json(fileTypes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file type stats" });
    }
  });

  app.get("/api/dashboard/recent-files", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const recentFiles = await storage.getRecentFiles(limit);
      res.json(recentFiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent files" });
    }
  });

  app.get("/api/dashboard/largest-files", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const largestFiles = await storage.getLargestFiles(limit);
      res.json(largestFiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch largest files" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    // Add security headers for file serving
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
  
  app.get("/uploads/:filename", async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      // Remove from files.json if present
      const files = await storage.getFiles();
      const fileEntry = files.find(f => f.name === filename);
      if (fileEntry) {
        await storage.deleteFile(fileEntry.id);
      }
      return res.status(404).json({ error: "File not found (removed from list)" });
    }
    res.sendFile(filePath);
  });

  // Thumbnail endpoint for lightweight image previews
  app.get("/uploads/thumbnail/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // For now, serve a placeholder or the original with cache headers for thumbnails
    // In production, you would generate actual thumbnails using sharp or similar
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Utility to remove missing files from files.json
async function removeMissingFilesFromJson() {
  const files = await storage.getFiles();
  let changed = false;
  for (const file of files) {
    if (!file.isFolder && file.path && !fs.existsSync(file.path)) {
      await storage.deleteFile(file.id);
      changed = true;
    }
  }
  return changed;
}
