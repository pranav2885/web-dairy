import { cn } from '@/lib/utils';
import type { MoodCategory, MoodMetadata } from '@/lib/db';
import { MOOD_CONFIG, MOOD_ORDER, createUserMood } from '@/lib/mood';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface MoodSelectorProps {
  autoMood?: MoodMetadata | null;
  selectedMood?: MoodMetadata | null;
  onMoodChange: (mood: MoodMetadata) => void;
  className?: string;
}

export function MoodSelector({ 
  autoMood, 
  selectedMood, 
  onMoodChange,
  className 
}: MoodSelectorProps) {
  const currentMood = selectedMood ?? autoMood;
  const currentScore = currentMood?.score ?? 0;

  const handleSliderChange = (value: number[]) => {
    const score = value[0];
    // Determine category from score
    let category: MoodCategory = 'neutral';
    for (const cat of MOOD_ORDER) {
      const [min, max] = MOOD_CONFIG[cat].range;
      if (score >= min && score < max) {
        category = cat;
        break;
      }
    }
    if (score >= 4) category = 'ecstatic';
    if (score <= -4) category = 'distressed';
    
    onMoodChange(createUserMood(category, score));
  };

  const handleQuickSelect = (category: MoodCategory) => {
    onMoodChange(createUserMood(category));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Auto-detected suggestion */}
      {autoMood && !selectedMood && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Detected mood:</span>
          <span className="text-lg">{autoMood.emoji}</span>
          <span>{MOOD_CONFIG[autoMood.category].label}</span>
          <span className="text-xs opacity-70">
            ({Math.round((autoMood.confidence ?? 0) * 100)}% confident)
          </span>
        </div>
      )}

      {/* Fine-grained slider */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          How are you feeling? ({currentScore.toFixed(1)})
        </Label>
        <div className="flex items-center gap-3">
          <span className="text-lg">💔</span>
          <Slider
            value={[currentScore]}
            onValueChange={handleSliderChange}
            min={-5}
            max={5}
            step={0.1}
            className="flex-1"
          />
          <span className="text-lg">🌟</span>
        </div>
      </div>

      {/* Quick-select emoji grid */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          Or pick a mood:
        </Label>
        <div className="flex flex-wrap gap-2">
          {MOOD_ORDER.map(category => {
            const config = MOOD_CONFIG[category];
            const isSelected = currentMood?.category === category;
            
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleQuickSelect(category)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all',
                  'border border-border hover:border-primary/50',
                  isSelected && 'bg-primary text-primary-foreground border-primary'
                )}
                title={config.label}
              >
                <span className="text-lg">{config.emoji}</span>
                <span className="text-xs font-medium hidden sm:inline">
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
