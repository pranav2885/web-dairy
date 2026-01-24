import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { 
  type DiaryEntry, 
  type MoodMetadata,
  createEntry, 
  updateEntry, 
  deleteEntry 
} from '@/lib/db';
import { analyzeSentiment } from '@/lib/mood';
import { MoodSelector } from './MoodSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface EntryEditorProps {
  entry?: DiaryEntry | null;
  onSave: () => void;
  onBack: () => void;
}

export function EntryEditor({ entry, onSave, onBack }: EntryEditorProps) {
  const [title, setTitle] = useState(entry?.plaintextTitle || '');
  const [content, setContent] = useState(entry?.plaintextContent || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [autoMood, setAutoMood] = useState<MoodMetadata | null>(entry?.autoMood || null);
  const [userMood, setUserMood] = useState<MoodMetadata | null>(entry?.userMood || null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Debounced sentiment analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        const mood = analyzeSentiment(content);
        setAutoMood(mood);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (entry) {
        await updateEntry(entry.id, {
          plaintextTitle: title,
          plaintextContent: content,
          tags,
          autoMood,
          userMood,
        });
      } else {
        await createEntry(title, content, tags, autoMood, userMood);
      }
      toast({
        title: 'Saved',
        description: 'Your entry has been saved securely.',
      });
      onSave();
    } catch (error) {
      console.error('Failed to save entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      toast({
        title: 'Deleted',
        description: 'Entry has been removed.',
      });
      onBack();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entry.',
        variant: 'destructive',
      });
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {entry && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The entry will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 container py-6 max-w-3xl">
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Entry title..."
              className="text-2xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind today?"
              className="min-h-[300px] resize-none border-0 px-0 focus-visible:ring-0 bg-transparent text-base leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleAddTag}
              placeholder="Add a tag and press Enter..."
              className="max-w-xs"
            />
          </div>

          {/* Mood Selector */}
          <div className="pt-4 border-t border-border">
            <MoodSelector
              autoMood={autoMood}
              selectedMood={userMood}
              onMoodChange={setUserMood}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
