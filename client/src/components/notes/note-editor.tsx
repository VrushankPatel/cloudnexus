import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, X, Star, Hash } from "lucide-react";
import type { Note } from "@shared/schema";

interface NoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSave: (noteData: any) => void;
  isLoading: boolean;
}

const noteColors = [
  { name: "Default", value: "default", color: "bg-slate-600" },
  { name: "Red", value: "red", color: "bg-red-500" },
  { name: "Blue", value: "blue", color: "bg-blue-500" },
  { name: "Green", value: "green", color: "bg-emerald-500" },
  { name: "Yellow", value: "yellow", color: "bg-amber-500" },
  { name: "Purple", value: "purple", color: "bg-purple-500" },
];

const MAX_TAGS = 8;

function normalizeTag(raw: string): string {
  let tag = raw.trim();
  if (!tag) return "";
  // Remove leading # for normalization
  tag = tag.replace(/^#+/, "");
  // If tag contains spaces, camelCase it
  if (tag.includes(" ")) {
    tag = tag
      .split(/\s+/)
      .map((word, i) =>
        i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join("");
  } else {
    tag = tag.toLowerCase();
  }
  return `#${tag}`;
}

export default function NoteEditor({ open, onOpenChange, note, onSave, isLoading }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("default");
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setIsPinned(note.isPinned);
      setTags(note.tags);
    } else {
      setTitle("");
      setContent("");
      setColor("default");
      setIsPinned(false);
      setTags([]);
    }
    setNewTag("");
  }, [note, open]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      color,
      isPinned,
      tags,
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim() || tags.length >= MAX_TAGS) return;
    let input = newTag.trim();
    let newTags: string[] = [];
    // If input contains multiple #, split by #
    if (input.includes("#")) {
      newTags = input
        .split("#")
        .map(t => t.trim())
        .filter(Boolean)
        .map(normalizeTag);
    } else if (input.includes(" ")) {
      // If input is multiple words, treat as one camelCase tag
      newTags = [normalizeTag(input)];
    } else {
      newTags = [normalizeTag(input)];
    }
    // Remove duplicates and already existing tags
    newTags = newTags.filter(t => t && !tags.includes(t));
    // Limit to max tags
    const allowed = Math.max(0, MAX_TAGS - tags.length);
    setTags([...tags, ...newTags.slice(0, allowed)]);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && title.trim() && content.trim()) {
      // Auto-save when closing dialog
      handleSave();
    } else {
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              variant={isPinned ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
            >
              <Star className={`w-4 h-4 ${isPinned ? "fill-current" : ""}`} />
            </Button>
          </div>
          
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[200px] resize-none"
          />
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Color</label>
              <div className="flex items-center space-x-2">
                {noteColors.map((noteColor) => (
                  <button
                    key={noteColor.value}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      noteColor.color
                    } ${
                      color === noteColor.value
                        ? "border-white"
                        : "border-slate-600 hover:border-slate-400"
                    }`}
                    onClick={() => setColor(noteColor.value)}
                    title={noteColor.name}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Tags</label>
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1"
                  maxLength={32}
                  disabled={tags.length >= MAX_TAGS}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || tags.length >= MAX_TAGS}
                >
                  <Hash className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {tags.length >= MAX_TAGS && (
                  <span className="text-xs text-amber-400 ml-2">Max {MAX_TAGS} tags</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
