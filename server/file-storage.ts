import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { files as fileSchema, notes as noteSchema, type File, type Note, type InsertFile, type InsertNote, type DashboardStats, type FileTypeStats, type RecentFile } from '@shared/schema';
import type { IStorage } from './storage';

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const FILES_PATH = path.join(DATA_DIR, 'files.json');
const NOTES_PATH = path.join(DATA_DIR, 'notes.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(FILES_PATH)) fs.writeFileSync(FILES_PATH, '[]');
  if (!fs.existsSync(NOTES_PATH)) fs.writeFileSync(NOTES_PATH, '[]');
}

function readJson<T>(file: string): T[] {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson<T>(file: string, data: T[]) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export class FileStorage implements IStorage {
  async getFiles(parentId?: number): Promise<File[]> {
    const files = readJson<File>(FILES_PATH);
    return typeof parentId === 'number' ? files.filter(f => f.parentId === parentId) : files.filter(f => !('parentId' in f) || f.parentId == null);
  }

  async getFile(id: number): Promise<File | undefined> {
    return readJson<File>(FILES_PATH).find(f => f.id === id);
  }

  async createFile(file: InsertFile): Promise<File> {
    const files = readJson<File>(FILES_PATH);
    const id = files.length ? Math.max(...files.map(f => f.id)) + 1 : 1;
    const now = new Date();
    const newFile: File = {
      ...file,
      id,
      uploadDate: now,
      lastModified: now,
      isFolder: file.isFolder ?? false,
      parentId: file.parentId ?? null,
      metadata: file.metadata ?? null,
    };
    files.push(newFile);
    writeJson(FILES_PATH, files);
    return newFile;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const files = readJson<File>(FILES_PATH);
    const idx = files.findIndex(f => f.id === id);
    if (idx === -1) return undefined;
    files[idx] = {
      ...files[idx],
      ...updates,
      lastModified: new Date(),
    };
    writeJson(FILES_PATH, files);
    return files[idx];
  }

  async deleteFile(id: number): Promise<boolean> {
    let files = readJson<File>(FILES_PATH);
    const origLen = files.length;
    files = files.filter(f => f.id !== id);
    writeJson(FILES_PATH, files);
    return files.length < origLen;
  }

  async searchFiles(query: string): Promise<File[]> {
    const files = readJson<File>(FILES_PATH);
    return files.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) || (f.originalName && f.originalName.toLowerCase().includes(query.toLowerCase())));
  }

  async getNotes(): Promise<Note[]> {
    return readJson<Note>(NOTES_PATH);
  }

  async getNote(id: number): Promise<Note | undefined> {
    return readJson<Note>(NOTES_PATH).find(n => n.id === id);
  }

  async createNote(note: InsertNote): Promise<Note> {
    const notes = readJson<Note>(NOTES_PATH);
    const id = notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1;
    const now = new Date();
    const newNote: Note = { ...note, id, createdAt: now, updatedAt: now } as Note;
    notes.push(newNote);
    writeJson(NOTES_PATH, notes);
    return newNote;
  }

  async updateNote(id: number, updates: Partial<InsertNote>): Promise<Note | undefined> {
    const notes = readJson<Note>(NOTES_PATH);
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return undefined;
    notes[idx] = { ...notes[idx], ...updates, updatedAt: new Date() };
    writeJson(NOTES_PATH, notes);
    return notes[idx];
  }

  async deleteNote(id: number): Promise<boolean> {
    let notes = readJson<Note>(NOTES_PATH);
    const origLen = notes.length;
    notes = notes.filter(n => n.id !== id);
    writeJson(NOTES_PATH, notes);
    return notes.length < origLen;
  }

  async searchNotes(query: string): Promise<Note[]> {
    const notes = readJson<Note>(NOTES_PATH);
    return notes.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const files = readJson<File>(FILES_PATH);
    const notes = readJson<Note>(NOTES_PATH);
    const totalFiles = files.length;
    const totalNotes = notes.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyUploads = files.filter(f => new Date(f.uploadDate) >= weekAgo).length;
    const storageLimit = 3 * 1024 * 1024 * 1024; // 3GB
    const storagePercentage = Math.round((totalSize / storageLimit) * 100);
    return {
      totalFiles,
      totalNotes,
      storageUsed: this.formatBytes(totalSize),
      weeklyUploads,
      storageUsage: {
        percentage: storagePercentage,
        used: totalSize,
        total: storageLimit,
      },
    };
  }

  async getFileTypeStats(): Promise<FileTypeStats[]> {
    const files = readJson<File>(FILES_PATH);
    const totalFiles = files.length;
    const typeMap: Record<string, { count: number }> = {};
    files.forEach(f => {
      if (!typeMap[f.mimeType]) typeMap[f.mimeType] = { count: 0 };
      typeMap[f.mimeType].count++;
    });
    return Object.entries(typeMap).map(([type, { count }], idx) => ({
      type,
      count,
      percentage: totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0,
      color: this.getTypeColor(idx),
    }));
  }

  async getRecentFiles(limit = 5): Promise<RecentFile[]> {
    const files = readJson<File>(FILES_PATH)
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    return files.slice(0, limit).map(f => ({
      id: f.id,
      name: f.name,
      size: this.formatBytes(f.size),
      uploadTime: new Date(f.uploadDate).toLocaleString(),
      mimeType: f.mimeType,
    }));
  }

  async getLargestFiles(limit = 10): Promise<File[]> {
    return readJson<File>(FILES_PATH).sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, limit);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getTypeColor(idx: number): string {
    const colors = ['#6366f1', '#f59e42', '#10b981', '#ef4444', '#eab308', '#3b82f6', '#a21caf'];
    return colors[idx % colors.length];
  }
}
