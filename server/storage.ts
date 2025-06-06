import { files, notes, type File, type Note, type InsertFile, type InsertNote, type DashboardStats, type FileTypeStats, type RecentFile } from "@shared/schema";
import { FileStorage } from './file-storage';

export interface IStorage {
  // Files
  getFiles(parentId?: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  searchFiles(query: string): Promise<File[]>;
  
  // Notes
  getNotes(): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, updates: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  searchNotes(query: string): Promise<Note[]>;
  
  // Analytics
  getDashboardStats(): Promise<DashboardStats>;
  getFileTypeStats(): Promise<FileTypeStats[]>;
  getRecentFiles(limit?: number): Promise<RecentFile[]>;
  getLargestFiles(limit?: number): Promise<File[]>;
}

export class MemStorage implements IStorage {
  private files: Map<number, File>;
  private notes: Map<number, Note>;
  private currentFileId: number;
  private currentNoteId: number;

  constructor() {
    this.files = new Map();
    this.notes = new Map();
    this.currentFileId = 1;
    this.currentNoteId = 1;
  }

  // Files
  async getFiles(parentId?: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.parentId === parentId
    );
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const now = new Date();
    const file: File = {
      ...insertFile,
      id,
      uploadDate: now,
      lastModified: now,
      parentId: insertFile.parentId ?? null,
      isFolder: insertFile.isFolder ?? false,
      metadata: insertFile.metadata ?? null,
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile: File = {
      ...file,
      ...updates,
      lastModified: new Date(),
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }

  async searchFiles(query: string): Promise<File[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.files.values()).filter(
      file => file.name.toLowerCase().includes(lowerQuery) ||
               file.originalName.toLowerCase().includes(lowerQuery)
    );
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const now = new Date();
    const note: Note = {
      ...insertNote,
      id,
      createdAt: now,
      updatedAt: now,
      color: insertNote.color ?? "default",
      isPinned: insertNote.isPinned ?? false,
      tags: insertNote.tags ?? [],
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, updates: Partial<InsertNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote: Note = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  async searchNotes(query: string): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.notes.values()).filter(
      note => note.title.toLowerCase().includes(lowerQuery) ||
              note.content.toLowerCase().includes(lowerQuery) ||
              note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const totalFiles = this.files.size;
    const totalNotes = this.notes.size;
    
    // Calculate storage used
    const totalBytes = Array.from(this.files.values())
      .reduce((sum, file) => sum + file.size, 0);
    const storageUsed = this.formatBytes(totalBytes);
    
    // Calculate weekly uploads (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyUploads = Array.from(this.files.values())
      .filter(file => file.uploadDate >= oneWeekAgo).length;

    // Storage usage calculation (assuming 3GB limit)
    const totalLimit = 3 * 1024 * 1024 * 1024; // 3GB in bytes
    const usagePercentage = Math.round((totalBytes / totalLimit) * 100);

    return {
      totalFiles,
      totalNotes,
      storageUsed,
      weeklyUploads,
      storageUsage: {
        percentage: usagePercentage,
        used: totalBytes,
        total: totalLimit,
      },
    };
  }

  async getFileTypeStats(): Promise<FileTypeStats[]> {
    const typeCounts = new Map<string, number>();
    const totalFiles = this.files.size;

    Array.from(this.files.values()).forEach(file => {
      if (file.isFolder) return;
      
      let type = 'Other';
      if (file.mimeType.startsWith('image/')) type = 'Images';
      else if (file.mimeType === 'application/pdf') type = 'PDFs';
      else if (file.mimeType.startsWith('video/')) type = 'Videos';
      else if (file.mimeType.includes('document') || file.mimeType.includes('text')) type = 'Documents';

      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    const colors = {
      'PDFs': '#ef4444',
      'Images': '#3b82f6',
      'Documents': '#10b981',
      'Videos': '#f59e0b',
      'Other': '#8b5cf6',
    };

    return Array.from(typeCounts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalFiles) * 100),
      color: colors[type as keyof typeof colors] || colors.Other,
    }));
  }

  async getRecentFiles(limit = 5): Promise<RecentFile[]> {
    return Array.from(this.files.values())
      .filter(file => !file.isFolder)
      .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
      .slice(0, limit)
      .map(file => ({
        id: file.id,
        name: file.name,
        size: this.formatBytes(file.size),
        uploadTime: this.formatRelativeTime(file.uploadDate),
        mimeType: file.mimeType,
      }));
  }

  async getLargestFiles(limit = 10): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => !file.isFolder)
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }
}

// Initialize storage based on environment
let storage: IStorage;

// Always use file-based storage
storage = new FileStorage();

export { storage };
