import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { EntryList } from '@/components/diary/EntryList';
import { EntryEditor } from '@/components/diary/EntryEditor';
import type { DiaryEntry } from '@/lib/db';

type View = 'list' | 'editor';

const Index = () => {
  const [view, setView] = useState<View>('list');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const handleSelectEntry = useCallback((entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setView('editor');
  }, []);

  const handleNewEntry = useCallback(() => {
    setSelectedEntry(null);
    setView('editor');
  }, []);

  const handleBack = useCallback(() => {
    setSelectedEntry(null);
    setView('list');
  }, []);

  const handleSave = useCallback(() => {
    setSelectedEntry(null);
    setView('list');
  }, []);

  if (view === 'editor') {
    return (
      <EntryEditor
        entry={selectedEntry}
        onSave={handleSave}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <EntryList 
          onSelectEntry={handleSelectEntry}
          onNewEntry={handleNewEntry}
        />
      </main>
    </div>
  );
};

export default Index;
