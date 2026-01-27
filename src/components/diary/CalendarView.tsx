/* eslint-disable no-case-declarations */
import { useEffect, useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfYear, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllEntries, type DiaryEntry } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month' | 'year';

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
  onNewEntry: () => void;
  selectedDate: Date | null;
}

export function CalendarView({ onDateSelect, onNewEntry, selectedDate }: CalendarViewProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('year');
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

  // Navigation functions
  const navigatePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentYear(currentYear - 1);
        setCurrentDate(subYears(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentYear(currentYear + 1);
        setCurrentDate(addYears(currentDate, 1));
        break;
    }
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCurrentYear(today.getFullYear());
  };

  // Get header title based on view mode
  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'year':
        return currentYear.toString();
    }
  };

  // Render day view
  const renderDayView = () => {
    const dayEntries = entries.filter(entry => 
      isSameDay(new Date(entry.createdAt), currentDate)
    );

    return (
      <div className="max-w-3xl mx-auto">
        <div className="border rounded-lg p-8">
          <h3 className="text-2xl font-semibold mb-6">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {dayEntries.length > 0 ? (
            <div className="space-y-4">
              {dayEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border border-foreground/10 hover:border-foreground/20 transition-colors cursor-pointer"
                  onClick={() => onDateSelect(currentDate)}
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
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No entries for this day</p>
              <Button onClick={onNewEntry} variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create Entry
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEntries = entries.filter(entry => 
              isSameDay(new Date(entry.createdAt), day)
            );
            const hasEntry = dayEntries.length > 0;
            const isTodayDate = isToday(day);

            return (
              <div
                key={dateKey}
                className={cn(
                  'border rounded-lg p-4 min-h-[200px] cursor-pointer transition-all',
                  'hover:border-foreground/30 hover:shadow-md',
                  isTodayDate && 'ring-2 ring-orange-500 bg-orange-500/10 border-orange-500'
                )}
                onClick={() => onDateSelect(day)}
              >
                <div className="text-center mb-3">
                  <p className={cn(
                    'text-xs font-semibold',
                    isTodayDate ? 'text-orange-500' : 'text-muted-foreground'
                  )}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={cn(
                    'text-2xl font-bold',
                    isTodayDate && 'text-orange-500'
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
                
                {hasEntry && (
                  <div className="space-y-2">
                    {dayEntries.slice(0, 3).map(entry => (
                      <div
                        key={entry.id}
                        className="text-xs p-2 rounded bg-foreground/5 truncate"
                      >
                        {entry.plaintextTitle || 'Untitled'}
                      </div>
                    ))}
                    {dayEntries.length > 3 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{dayEntries.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = monthStart.getDay();
    const weekDaysFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="max-w-5xl mx-auto">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDaysFull.map(day => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {monthDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEntries = entries.filter(entry => 
              isSameDay(new Date(entry.createdAt), day)
            );
            const hasEntry = dayEntries.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const moodHoverStyle = getMoodHoverStyle(dateKey, isSelected);

            return (
              <button
                key={dateKey}
                onClick={() => onDateSelect(day)}
                style={moodHoverStyle}
                className={cn(
                  'aspect-square rounded-lg border relative transition-all duration-150',
                  'flex flex-col items-start justify-start p-2 text-left',
                  'hover:border-foreground/30 hover:shadow-md',
                  isSelected && 'bg-foreground text-background border-foreground',
                  !isSelected && isTodayDate && 'ring-2 ring-orange-500 bg-orange-500/10 border-orange-500',
                  !isSelected && !hasEntry && 'hover:bg-foreground/5 border-foreground/10',
                  hasEntry && !isSelected && 'border-foreground/20 [&:hover]:bg-[var(--mood-hover-bg)]',
                )}
              >
                <span className={cn(
                  'text-sm font-semibold',
                  isSelected && 'text-background',
                  isTodayDate && !isSelected && 'text-orange-500'
                )}>
                  {format(day, 'd')}
                </span>
                
                {/* Entry indicators */}
                {hasEntry && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayEntries.slice(0, 3).map((entry, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isSelected ? 'bg-background' : 'bg-foreground'
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render year view (existing functionality)
  const renderYearView = () => {
    return (
      <>
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
                {month.monthDays.map((day, dayIndex) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const hasEntry = datesWithEntries.has(dateKey);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const moodHoverStyle = getMoodHoverStyle(dateKey, isSelected);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => onDateSelect(day)}
                      style={{
                        ...moodHoverStyle,
                        boxShadow: hasEntry 
                          ? '0 0 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(252, 165, 165, 0.3)'
                          : '0 0 15px rgba(251, 146, 60, 0.3)'
                      }}
                      className={cn(
                        'aspect-square rounded-full relative transition-all duration-200',
                        'flex flex-col items-center justify-center text-sm font-medium',
                        'hover:scale-110 hover:shadow-lg',
                        isSelected && 'bg-foreground text-background scale-110 font-bold',
                        !isSelected && isTodayDate && 'ring-2 ring-orange-500 bg-orange-500/20 font-bold scale-105',
                        !isSelected && !hasEntry && 'hover:bg-foreground/10',
                        hasEntry && !isSelected && '[&:hover]:bg-[var(--mood-hover-bg)]',
                      )}
                    >
                      <span className={cn(
                        isSelected && 'text-background',
                        !isSelected && isTodayDate && 'text-orange-500',
                        !isSelected && !isTodayDate && 'text-foreground'
                      )}>
                        {format(day, 'd')}
                      </span>
                      
                      {/* Entry indicator dot */}
                      {hasEntry && (
                        <div 
                          className={cn(
                            'absolute bottom-1 w-1 h-1 rounded-full',
                            isSelected ? 'bg-background' : 'bg-foreground'
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* View Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={navigatePrevious}
            className="h-9 transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToday}
            className="h-9 min-w-[80px] transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ boxShadow: '0 0 20px rgba(251, 146, 60, 0.4)' }}
          >
            Today
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={navigateNext}
            className="h-9 transition-all duration-200 hover:scale-105"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center transition-all duration-200">
        <h2 
          className="text-4xl font-extrabold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #fb923c 0%, #fdba74 25%, #fbbf24 50%, #fcd34d 75%, #fb923c 100%)',
            backgroundSize: '300% 300%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {getHeaderTitle()}
        </h2>
      </div>

      {/* Render appropriate view */}
      <div className="transition-all duration-200">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'year' && renderYearView()}
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
      <div className="border-t border-foreground/10 pt-6 mt-8 transition-all duration-200">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:shadow-xl" style={{ boxShadow: '0 10px 30px rgba(251, 146, 60, 0.4)' }}>
              <p 
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #fb923c, #fdba74)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {entries.length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Total Entries</p>
            </div>
            <div className="transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:shadow-xl" style={{ boxShadow: '0 10px 30px rgba(252, 165, 165, 0.4)' }}>
              <p 
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #fca5a5, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {datesWithEntries.size}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Days Logged</p>
            </div>
            <div className="transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:shadow-xl" style={{ boxShadow: '0 10px 30px rgba(251, 146, 60, 0.4)' }}>
              <p 
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #fb923c, #fdba74)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
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
