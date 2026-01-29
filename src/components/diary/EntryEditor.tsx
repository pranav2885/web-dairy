import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Save, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Palette, FileText } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';

interface EntryEditorProps {
  entry?: DiaryEntry | null;
  selectedDate?: Date | null;
  onSave: () => void;
  onBack: () => void;
}

export function EntryEditor({ entry, selectedDate, onSave, onBack }: EntryEditorProps) {
  const [title, setTitle] = useState(entry?.plaintextTitle || '');
  const [content, setContent] = useState(entry?.plaintextContent || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [autoMood, setAutoMood] = useState<MoodMetadata | null>(entry?.autoMood || null);
  const [userMood, setUserMood] = useState<MoodMetadata | null>(entry?.userMood || null);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Rich text formatting states
  const [textColor, setTextColor] = useState('#000000');
  const [currentFormat, setCurrentFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
  });

  // Word and character count
  const { wordCount, charCount } = useMemo(() => {
    const text = content.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = content.length;
    return { wordCount: words, charCount: chars };
  }, [content]);

  // Templates
  const templates = [
    { name: 'Daily Reflection', content: '📅 Today\'s Date:\n\n🌅 Morning Thoughts:\n\n🎯 Goals for Today:\n\n✨ Highlights:\n\n💭 Reflections:\n\n🌙 Evening Notes:' },
    { name: 'Gratitude Journal', content: '🙏 Three Things I\'m Grateful For:\n\n1. \n2. \n3. \n\n💖 Why I\'m Grateful:\n\n✨ Positive Moment of the Day:' },
    { name: 'Dream Journal', content: '🌙 Date:\n\n💭 Dream Description:\n\n😊 Emotions Felt:\n\n🔍 Symbols & Themes:\n\n💡 Interpretation:' },
    { name: 'Goal Setting', content: '🎯 Goal:\n\n📋 Why This Matters:\n\n📝 Action Steps:\n\n1. \n2. \n3. \n\n⏰ Timeline:\n\n✅ Success Metrics:' },
  ];

  const applyTemplate = (template: string) => {
    setContent(template);
    if (contentRef.current) {
      contentRef.current.innerText = template;
    }
    setShowTemplates(false);
  };

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
        await createEntry(title, content, tags, autoMood, userMood, selectedDate);
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

  // Rich text formatting functions
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateFormatState();
  };

  const toggleBold = () => execCommand('bold');
  const toggleItalic = () => execCommand('italic');
  const toggleUnderline = () => execCommand('underline');
  const setAlignment = (align: string) => {
    const command = align === 'left' ? 'justifyLeft' : 
                   align === 'center' ? 'justifyCenter' : 
                   align === 'right' ? 'justifyRight' : 'justifyFull';
    execCommand(command);
  };
  const insertUnorderedList = () => execCommand('insertUnorderedList');
  const insertOrderedList = () => execCommand('insertOrderedList');
  const changeFontColor = (color: string) => {
    setTextColor(color);
    execCommand('foreColor', color);
  };

  const updateFormatState = () => {
    setCurrentFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      align: document.queryCommandState('justifyCenter') ? 'center' :
             document.queryCommandState('justifyRight') ? 'right' :
             document.queryCommandState('justifyFull') ? 'justify' : 'left',
    });
  };

  const handleContentInput = useCallback(() => {
    if (contentRef.current) {
      const text = contentRef.current.innerText;
      setContent(text);
    }
  }, []);

  // Initialize content when entry changes
  useEffect(() => {
    if (contentRef.current && entry?.plaintextContent) {
      contentRef.current.innerText = entry.plaintextContent;
    }
  }, [entry?.id]);

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
          {/* Timestamp */}
          <div className="text-center text-xs font-semibold text-muted-foreground tracking-wider">
            {new Date().toLocaleString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true 
            }).toUpperCase()}
          </div>

          {/* Rich Text Toolbar */}
          <div className="sticky top-14 z-30 bg-background border-y border-border py-2">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {/* Text Style Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBold}
                className={cn(
                  'h-8 w-8 p-0',
                  currentFormat.bold && 'bg-accent'
                )}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleItalic}
                className={cn(
                  'h-8 w-8 p-0',
                  currentFormat.italic && 'bg-accent'
                )}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleUnderline}
                className={cn(
                  'h-8 w-8 p-0',
                  currentFormat.underline && 'bg-accent'
                )}
                title="Underline (Ctrl+U)"
              >
                <Underline className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Alignment Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAlignment('left')}
                className={cn(
                  'h-8 w-8 p-0',
                  currentFormat.align === 'left' && 'bg-accent'
                )}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAlignment('center')}
                className={cn(
                  'h-8 w-8 p-0',
                  currentFormat.align === 'center' && 'bg-accent'
                )}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAlignment('right')}
                className={cn(
                  'h-8 w-8 p-0',
                  currentFormat.align === 'right' && 'bg-accent'
                )}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAlignment('justify')}
                className={cn(
                  'h-8 w-8 p-0',
                  currentFormat.align === 'justify' && 'bg-accent'
                )}
                title="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              {/* List Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={insertUnorderedList}
                className="h-8 w-8 p-0"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={insertOrderedList}
                className="h-8 w-8 p-0"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Color Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Text Color"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <div className="grid grid-cols-8 gap-2">
                    {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF',
                      '#808080', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0'].map(color => (
                      <button
                        key={color}
                        onClick={() => changeFontColor(color)}
                        className="w-6 h-6 rounded border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Templates */}
              <Popover open={showTemplates} onOpenChange={setShowTemplates}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 gap-1.5"
                    title="Choose Template"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Template</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="space-y-1">
                    {templates.map((template) => (
                      <Button
                        key={template.name}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => applyTemplate(template.content)}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Entry title..."
              className="text-2xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent"
            />
          </div>

          {/* Rich Text Content */}
          <div className="space-y-2 relative">
            <div
              ref={contentRef}
              contentEditable
              onInput={handleContentInput}
              onMouseUp={updateFormatState}
              onKeyUp={updateFormatState}
              className="min-h-[300px] border-0 px-0 focus:outline-none bg-transparent text-base leading-relaxed"
              style={{ whiteSpace: 'pre-wrap' }}
              suppressContentEditableWarning
            />
            {!content && (
              <div className="absolute top-0 left-0 pointer-events-none text-muted-foreground">
                Start writing or choose a Template
              </div>
            )}
          </div>

          {/* Word and Character Count */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground border-t border-border pt-4">
            <span>Words {wordCount}</span>
            <span>•</span>
            <span>Characters {charCount}</span>
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
