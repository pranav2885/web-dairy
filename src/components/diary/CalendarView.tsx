import { useEffect, useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfYear } from 'date-fns';
import { Plus } from 'lucide-react';
import { getAllEntries, type DiaryEntry } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
  onNewEntry: () => void;
  selectedDate: Date | null;
}

export function CalendarView({ onDateSelect, onNewEntry, selectedDate }: CalendarViewProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
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

  // Get dates with entries and their moods
  const dateEntryMap = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    entries.forEach(entry => {
      const dateKey = format(new Date(entry.createdAt), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  const datesWithEntries = useMemo(() => {
    return new Set(dateEntryMap.keys());
  }, [dateEntryMap]);

  // Get mood color for a date
  const getMoodHoverStyle = (dateKey: string, isSelected: boolean): React.CSSProperties => {
    if (isSelected) return {};
    
    const dateEntries = dateEntryMap.get(dateKey);
    if (!dateEntries || dateEntries.length === 0) return {};
    
    // Use the first entry's mood for the color
    const mood = dateEntries[0].userMood || dateEntries[0].autoMood;
    if (!mood) return {};
    
    // Map mood categories to grayscale values for hover effect
    // Higher scores = lighter gray, lower scores = darker gray
    const moodGrayScale: Record<string, number> = {
      ecstatic: 85,    // lightest
      joyful: 75,
      content: 65,
      hopeful: 55,
      neutral: 50,     // middle
      thoughtful: 45,
      melancholy: 35,
      anxious: 25,
      distressed: 15,  // darkest
    };
    
    const grayValue = moodGrayScale[mood.category] || 50;
    
    return {
      '--mood-hover-bg': `hsl(0, 0%, ${grayValue}%)`,
    } as React.CSSProperties;
  };

  // Get entries for selected date
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter(entry => 
      isSameDay(new Date(entry.createdAt), selectedDate)
    );
  }, [entries, selectedDate]);

  // Generate all 12 months for the current year
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const firstDayOfWeek = monthStart.getDay();
      
      return {
        date,
        monthStart,
        monthEnd,
        monthDays,
        firstDayOfWeek,
        name: format(date, 'MMMM')
      };
    });
  }, [currentYear]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Year Header */}
      <div className="text-center">
        <h2 className="text-4xl font-extrabold tracking-tight">
          {currentYear}
        </h2>
      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {months.map((month) => (
          <div key={month.name} className="space-y-3">
            {/* Month Name */}
            <h3 className="text-lg font-semibold text-center">
              {month.name}
            </h3>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: month.firstDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {month.monthDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasEntry = datesWithEntries.has(dateKey);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const moodHoverStyle = getMoodHoverStyle(dateKey, isSelected);

                return (
                  <button
                    key={dateKey}
                    onClick={() => onDateSelect(day)}
                    style={moodHoverStyle}
                    className={cn(
                      'aspect-square rounded-full relative transition-all duration-150',
                      'flex flex-col items-center justify-center text-sm font-medium',
                      'hover:scale-110',
                      isSelected && 'bg-foreground text-background scale-110 font-bold',
                      !isSelected && isTodayDate && 'ring-2 ring-foreground/40 font-semibold',
                      !isSelected && !hasEntry && 'hover:bg-foreground/10',
                      hasEntry && !isSelected && '[&:hover]:bg-[var(--mood-hover-bg)]',
                    )}
                  >
                    <span className={cn(
                      isSelected && 'text-background',
                      !isSelected && 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Entry indicator dot */}
                    {hasEntry && (
                      <div className={cn(
                        'absolute bottom-1 w-1 h-1 rounded-full',
                        isSelected ? 'bg-background' : 'bg-foreground'
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="border-t border-foreground/10 pt-6 mt-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <Button
                onClick={onNewEntry}
                size="sm"
                className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </div>

            {selectedDateEntries.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entry' : 'entries'} on this day
                </p>
                <div className="space-y-2">
                  {selectedDateEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg border border-foreground/10 hover:border-foreground/20 transition-colors cursor-pointer"
                    >
                      <p className="text-base font-medium">
                        {entry.plaintextTitle || 'Untitled Entry'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(entry.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No entries for this day
                </p>
                <Button
                  onClick={onNewEntry}
                  variant="outline"
                  className="gap-1.5 border-foreground/20 hover:bg-foreground/5"
                >
                  <Plus className="h-4 w-4" />
                  Create Entry
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="border-t border-foreground/10 pt-6 mt-8">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold">{entries.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Total Entries</p>
            </div>
            <div>
              <p className="text-4xl font-bold">{datesWithEntries.size}</p>
              <p className="text-sm text-muted-foreground mt-2">Days Logged</p>
            </div>
            <div>
              <p className="text-4xl font-bold">
                {entries.length > 0 ? Math.round(entries.length / datesWithEntries.size * 10) / 10 : 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Avg Per Day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
