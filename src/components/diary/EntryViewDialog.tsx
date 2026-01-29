import { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Calendar, Clock, Tag, Heart, X } from 'lucide-react';
import type { DiaryEntry } from '@/lib/db';
import { deleteEntry } from '@/lib/db';
import { MoodBadge } from './MoodBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EntryViewDialogProps {
  entry: DiaryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (entry: DiaryEntry) => void;
  onDeleted: () => void;
}

export function EntryViewDialog({ entry, open, onOpenChange, onEdit, onDeleted }: EntryViewDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  if (!entry) return null;

  const displayMood = entry.userMood ?? entry.autoMood;
  const title = entry.plaintextTitle || 'Untitled Entry';
  const content = entry.plaintextContent || 'No content';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEntry(entry.id);
      toast({
        title: 'Deleted',
        description: 'Entry has been removed.',
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entry.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(entry);
  };

  // Calculate reading time
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col">
          {/* Header with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 p-6 border-b flex-shrink-0">
            <DialogHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <DialogTitle className="text-3xl font-bold leading-tight pr-8">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-3 text-base">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(entry.createdAt), 'EEEE, MMMM d, yyyy')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {format(new Date(entry.createdAt), 'h:mm a')}
                    </span>
                    {wordCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-muted-foreground">
                          {readingTime} min read
                        </span>
                      </>
                    )}
                  </DialogDescription>
                </div>
                {displayMood && (
                  <div className="flex flex-col items-end gap-2">
                    <MoodBadge category={displayMood.category} size="lg" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {displayMood.category}
                    </span>
                  </div>
                )}
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-6 px-6 py-6">
              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {entry.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-sm px-3 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-base leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              </div>

              {/* Mood Details */}
              {displayMood && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Mood Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{displayMood.score.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium capitalize">{displayMood.category}</p>
                      </div>
                      {displayMood.confidence !== undefined && (
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-medium">{(displayMood.confidence * 100).toFixed(0)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Auto Mood vs User Mood */}
              {entry.autoMood && entry.userMood && entry.autoMood.category !== entry.userMood.category && (
                <>
                  <Separator className="my-6" />
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <p className="text-sm font-medium">Mood Comparison</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">AI Detected</p>
                        <MoodBadge category={entry.autoMood.category} size="sm" />
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">You Selected</p>
                        <MoodBadge category={entry.userMood.category} size="sm" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Metadata */}
              <Separator className="my-6" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {format(new Date(entry.createdAt), 'PPpp')}</p>
                {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                  <p>Last edited: {format(new Date(entry.updatedAt), 'PPpp')}</p>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 p-4 border-t bg-muted/20 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button
                onClick={handleEdit}
                className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Edit className="h-4 w-4" />
                Edit Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The entry "{title}" will be permanently removed from your diary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Entry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
