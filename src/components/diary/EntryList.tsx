import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getAllEntries, type DiaryEntry } from '@/lib/db';
import { EntryCard } from './EntryCard';
import { Button } from '@/components/ui/button';

interface EntryListProps {
  onSelectEntry: (entry: DiaryEntry) => void;
  onNewEntry: () => void;
}

export function EntryList({ onSelectEntry, onNewEntry }: EntryListProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const allEntries = await getAllEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading your entries...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-3xl">📔</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Your diary awaits
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start capturing your thoughts, feelings, and moments. Your entries are encrypted and private.
        </p>
        <Button onClick={onNewEntry} className="gap-2">
          <Plus className="h-4 w-4" />
          Write your first entry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Your Entries
        </h2>
        <Button onClick={onNewEntry} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(entry => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onClick={() => onSelectEntry(entry)}
          />
        ))}
      </div>
    </div>
  );
}
