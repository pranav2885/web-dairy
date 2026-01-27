/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CalendarView } from '@/components/diary/CalendarView';
import { EntryEditor } from '@/components/diary/EntryEditor';
import { CursorSettings } from '@/components/CursorSettings';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { DiaryEntry } from '@/lib/db';
import type { CursorStyle, CursorSize, CursorTheme } from '@/components/CustomCursor';
import { AnimatedBackground } from '@/components/AnimatedBackground';

type View = 'calendar' | 'editor';

interface IndexProps {
  cursorConfig: {
    cursorStyle: CursorStyle;
    cursorSize: CursorSize;
    cursorTheme: CursorTheme;
    speedSensitivity: number;
    enabled: boolean;
  };
  onCursorConfigChange: (config: any) => void;
}

const Index = ({ cursorConfig, onCursorConfigChange }: IndexProps) => {
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      {/* Minimalist dark gradient background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(251, 146, 60, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(252, 165, 165, 0.06) 0%, transparent 50%)',
        }}
      />
      <AnimatedBackground />
      <Header />
      <main className="container max-w-4xl py-8 px-4">
        <div className="mb-8 text-center relative">
          <h1 
            className="text-4xl font-extrabold tracking-wide mb-2 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent"
          >
            My SoulLog
          </h1>
          <p className="text-muted-foreground">
            Your personal space for capturing your soul's journey
          </p>
          
          {/* Cursor Settings Button */}
          <div 
            className="absolute top-0 right-0"
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
            whileHover={{ rotate: 90, scale: 1.1 }}
          >
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                  <SheetDescription>
                    Customize your diary experience
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <CursorSettings
                    cursorStyle={cursorConfig.cursorStyle}
                    cursorSize={cursorConfig.cursorSize}
                    cursorTheme={cursorConfig.cursorTheme}
                    speedSensitivity={cursorConfig.speedSensitivity}
                    enabled={cursorConfig.enabled}
                    onStyleChange={(style) => onCursorConfigChange({ ...cursorConfig, cursorStyle: style })}
                    onSizeChange={(size) => onCursorConfigChange({ ...cursorConfig, cursorSize: size })}
                    onThemeChange={(theme) => onCursorConfigChange({ ...cursorConfig, cursorTheme: theme })}
                    onSpeedChange={(speed) => onCursorConfigChange({ ...cursorConfig, speedSensitivity: speed })}
                    onEnabledChange={(enabled) => onCursorConfigChange({ ...cursorConfig, enabled })}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
