import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, insertNoteSchema } from "@shared/schema";
import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import { files as fileSchema, type File } from '@shared/schema';
import type { File as FileType } from '@shared/schema';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "data", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      let dest = uploadDir;
      // If parentId is present, store in subdirectory
      const parentId = req.body.parentId ? String(req.body.parentId) : null;
      if (parentId) {
        dest = path.join(uploadDir, parentId);
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
      }
      cb(null, dest);
    },
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
      let changed = false;
      for (let i = files.length - 1; i >= 0; i--) {
        const f = files[i];
        if (f.isFolder) {
          // For folders, we don't check physical existence since they're virtual
          // Only check if they have any children that exist
          const hasChildren = files.some(child => child.parentId === f.id);
          if (!hasChildren) {
            // If folder has no children, it can be removed
            files.splice(i, 1);
            changed = true;
          }
        } else if (f.path && !fs.existsSync(f.path)) {
          // Remove missing file
          files.splice(i, 1);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(FILES_PATH, JSON.stringify(files, null, 2));
        console.log(`[CLEANUP] Recursively removed missing folders/files from files.json`);
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

      // If it's a folder, recursively delete all contents
      if (file.isFolder) {
        const files = await storage.getFiles();
        // Recursively remove all children from files.json and disk
        recursiveRemoveFolderAndContents(id, files, uploadDir);
        // Remove the folder's directory if it exists
        const folderPath = path.join(uploadDir, String(id));
        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
        // Write updated files.json
        const FILES_PATH = path.join(process.cwd(), 'data', 'files.json');
        fs.writeFileSync(FILES_PATH, JSON.stringify(files, null, 2));
      } else {
        // Delete physical file if it exists
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
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
    let filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      // Search all subdirectories for the file
      const subdirs = fs.readdirSync(uploadDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      let found = false;
      for (const subdir of subdirs) {
        const candidate = path.join(uploadDir, subdir, filename);
        if (fs.existsSync(candidate)) {
          filePath = candidate;
          found = true;
          break;
        }
      }
      if (!found) {
        // Remove from files.json if present
        const files = await storage.getFiles();
        const fileEntry = files.find(f => f.name === filename);
        if (fileEntry) {
          await storage.deleteFile(fileEntry.id);
        }
        return res.status(404).json({ error: "File not found (removed from list)" });
      }
    }
    res.sendFile(filePath);
  });

  // Thumbnail endpoint for lightweight image previews
  app.get("/uploads/thumbnail/:filename", (req, res) => {
    const filename = req.params.filename;
    let filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      // Search all subdirectories for the file
      const subdirs = fs.readdirSync(uploadDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      let found = false;
      for (const subdir of subdirs) {
        const candidate = path.join(uploadDir, subdir, filename);
        if (fs.existsSync(candidate)) {
          filePath = candidate;
          found = true;
          break;
        }
      }
      if (!found) {
        return res.status(404).json({ error: "File not found" });
      }
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

// Recursive cleanup for missing folders
function recursiveRemoveFolderAndContents(folderId: number, files: FileType[], uploadsDir: string): void {
  // Find all children (files and subfolders)
  const children = files.filter((f: FileType) => f.parentId === folderId);
  for (const child of children) {
    if (child.isFolder) {
      // Recursively remove subfolder
      recursiveRemoveFolderAndContents(child.id, files, uploadsDir);
      // Remove subfolder directory if exists
      const subfolderPath = path.join(uploadsDir, String(child.id));
      if (fs.existsSync(subfolderPath)) {
        fs.rmSync(subfolderPath, { recursive: true, force: true });
      }
    } else {
      // Remove file from disk
      if (child.path && fs.existsSync(child.path)) {
        fs.unlinkSync(child.path);
      }
    }
    // Remove from files array
    const idx = files.findIndex((f: FileType) => f.id === child.id);
    if (idx !== -1) files.splice(idx, 1);
  }
}

// Utility to remove missing files/folders from files.json recursively
async function removeMissingFilesFromJson() {
  // Ensure FILES_PATH and uploadDir are accessible
  const DATA_DIR = path.join(process.cwd(), 'data');
  const FILES_PATH = path.join(DATA_DIR, 'files.json');
  const uploadDir = path.join(process.cwd(), 'data', 'uploads');
  let files: FileType[] = [];
  try {
    files = JSON.parse(fs.readFileSync(FILES_PATH, 'utf-8'));
  } catch {}
  let changed = false;
  for (let i = files.length - 1; i >= 0; i--) {
    const f = files[i];
    if (f.isFolder) {
      const folderPath = path.join(uploadDir, String(f.id));
      if (!fs.existsSync(folderPath)) {
        recursiveRemoveFolderAndContents(f.id, files, uploadDir);
        files.splice(i, 1);
        changed = true;
      }
    } else if (f.path && !fs.existsSync(f.path)) {
      files.splice(i, 1);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(FILES_PATH, JSON.stringify(files, null, 2));
    console.log(`[CLEANUP] Recursively removed missing folders/files from files.json`);
  }
  return changed;
}
