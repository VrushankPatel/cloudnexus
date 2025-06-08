import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NoteCard from "@/components/notes/note-card";
import NoteEditor from "@/components/notes/note-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@shared/schema";

export default function Notes() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filterColor, setFilterColor] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setShowEditor(false);
      setSelectedNote(null);
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...noteData }: any) => {
      const response = await apiRequest("PUT", `/api/notes/${id}`, noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setShowEditor(false);
      setSelectedNote(null);
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await apiRequest("DELETE", `/api/notes/${noteId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  const handleNewNote = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleSaveNote = (noteData: any) => {
    if (selectedNote) {
      updateNoteMutation.mutate({ id: selectedNote.id, ...noteData });
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const handleDeleteNote = (noteId: number) => {
    deleteNoteMutation.mutate(noteId);
  };

  const handleTogglePin = (note: Note) => {
    updateNoteMutation.mutate({
      id: note.id,
      isPinned: !note.isPinned,
    });
  };

  const filteredNotes = notes?.filter((note: Note) => {
    if (filterColor !== "all" && note.color !== filterColor) return false;
    if (filterType === "pinned" && !note.isPinned) return false;
    return true;
  }) || [];

  const noteColors = [
    { name: "All", value: "all", color: "bg-slate-600" },
    { name: "Default", value: "default", color: "bg-slate-600" },
    { name: "Red", value: "red", color: "bg-red-500" },
    { name: "Blue", value: "blue", color: "bg-blue-500" },
    { name: "Green", value: "green", color: "bg-emerald-500" },
    { name: "Yellow", value: "yellow", color: "bg-amber-500" },
    { name: "Purple", value: "purple", color: "bg-purple-500" },
  ];

  return (
    <div className="h-full w-full overflow-x-hidden">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">Notes</h2>
              <p className="text-muted-foreground">Capture your thoughts and ideas</p>
            </div>
            <Button onClick={handleNewNote} className="bg-primary hover:bg-primary/90 shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 p-4 bg-card rounded-xl border border-border overflow-x-auto">
            <div className="flex items-center gap-2 min-w-fit">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Filter:</span>
              <Button
                variant={filterType === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "pinned" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType("pinned")}
              >
                Pinned
              </Button>
            </div>
            
            <div className="flex items-center gap-2 min-w-fit">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Colors:</span>
              <div className="flex gap-2 flex-wrap">
                {noteColors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-6 h-6 rounded-full border-2 transition-colors flex-shrink-0 ${
                      color.color
                    } ${
                      filterColor === color.value
                        ? "border-foreground"
                        : "border-muted hover:border-muted-foreground"
                    }`}
                    onClick={() => setFilterColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="notes-grid">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="note-card bg-card rounded-xl border border-border p-4 animate-pulse"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="w-8 h-4 bg-muted rounded" />
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                  <div className="h-3 bg-muted rounded w-4/6" />
                </div>
                <div className="h-3 bg-muted rounded w-20 mt-4" />
              </div>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="notes-grid">
            {filteredNotes.map((note: Note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">Create your first note to get started</p>
            <Button onClick={handleNewNote}>
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </div>
        )}

        <NoteEditor
          open={showEditor}
          onOpenChange={setShowEditor}
          note={selectedNote}
          onSave={handleSaveNote}
          isLoading={createNoteMutation.isPending || updateNoteMutation.isPending}
        />
      </div>
    </div>
  );
}
