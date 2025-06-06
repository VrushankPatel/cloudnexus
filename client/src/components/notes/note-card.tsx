import { MoreVertical, Star, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime, getNoteColorClass, truncateText } from "@/lib/utils";
import type { Note } from "@shared/schema";

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
      className={`note-card bg-slate-800 rounded-xl border cursor-pointer transition-all p-4 hover:border-slate-600 ${colorClass}`}
      onClick={() => onEdit(note)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-sm line-clamp-2">{note.title}</h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 ${note.isPinned ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note);
            }}
          >
            <Star className={`w-4 h-4 ${note.isPinned ? "fill-current" : ""}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="p-1 text-slate-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit(note)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin(note)}>
                <Star className="w-4 h-4 mr-2" />
                {note.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-400"
                onClick={() => onDelete(note.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="text-sm text-slate-300 mb-3">
        <div 
          className="prose prose-sm prose-invert max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: truncateText(note.content, 200) 
          }} 
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{formatRelativeTime(note.updatedAt)}</span>
        <div className="flex items-center space-x-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-primary/20 text-primary rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
