import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { CalendarView } from '@/components/diary/CalendarView';
import { EntryEditor } from '@/components/diary/EntryEditor';
import type { DiaryEntry } from '@/lib/db';

type View = 'calendar' | 'editor';

const Index = () => {
  const [view, setView] = useState<View>('calendar');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleNewEntry = useCallback(() => {
    setSelectedEntry(null);
    setView('editor');
  }, []);

  const handleBack = useCallback(() => {
    setSelectedEntry(null);
    setView('calendar');
  }, []);

  const handleSave = useCallback(() => {
    setSelectedEntry(null);
    setView('calendar');
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
      <main className="container max-w-4xl py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            My Diary
          </h1>
          <p className="text-muted-foreground">
            Your personal space for thoughts and memories
          </p>
        </div>
        <CalendarView 
          onDateSelect={handleDateSelect}
          onNewEntry={handleNewEntry}
          selectedDate={selectedDate}
        />
      </main>
    </div>
  );
};

export default Index;
