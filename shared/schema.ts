import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
  isFolder: boolean("is_folder").default(false).notNull(),
  parentId: integer("parent_id"),
  metadata: jsonb("metadata"), // For PDF metadata, image dimensions, etc.
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  color: text("color").default("default").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  tags: text("tags").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadDate: true,
  lastModified: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Analytics types
export interface DashboardStats {
  totalFiles: number;
  totalNotes: number;
  storageUsed: string;
  weeklyUploads: number;
  storageUsage: {
    percentage: number;
    used: number;
    total: number;
  };
}

export interface FileTypeStats {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RecentFile {
  id: number;
  name: string;
  size: string;
  uploadTime: string;
  mimeType: string;
}
