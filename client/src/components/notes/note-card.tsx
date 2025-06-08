import { MoreVertical, Edit, Trash2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime, getNoteColorClass, truncateText } from "@/lib/utils";
import type { Note } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: number) => void;
  onTogglePin: (note: Note) => void;
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  const colorClass = getNoteColorClass(note.color);

  return (
    <div
      className={`note-card bg-card rounded-xl border cursor-pointer p-4 hover:border-border/60 ${colorClass} min-h-[200px] max-h-[400px] flex flex-col`}
      onClick={() => onEdit(note)}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3 className="font-medium text-sm text-foreground/90 line-clamp-2 flex-1">{note.title}</h3>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 ${note.isPinned ? "text-amber-400" : "text-muted-foreground hover:text-amber-400"}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note);
            }}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? "fill-current" : ""}`} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="p-1 text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <p className="text-sm text-muted-foreground/80 break-words whitespace-pre-wrap line-clamp-[12]">
          {note.content}
        </p>
      </div>
      
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 mb-1">
          {note.tags.map((tag) => (
            <Badge
              key={tag}
              className="bg-amber-400 text-amber-900 font-semibold px-2 py-0.5 rounded-full text-[11px] border-none shadow-sm"
              style={{ letterSpacing: '0.01em' }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
      
      <div className="mt-auto pt-3 text-xs text-muted-foreground border-t border-border/40">
        {formatRelativeTime(new Date(note.updatedAt))}
      </div>
    </div>
  );
}
