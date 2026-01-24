import { cn } from '@/lib/utils';
import type { MoodCategory } from '@/lib/db';
import { MOOD_CONFIG } from '@/lib/mood';

interface MoodBadgeProps {
  category: MoodCategory;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MoodBadge({ 
  category, 
  showLabel = false, 
  size = 'md',
  className 
}: MoodBadgeProps) {
  const config = MOOD_CONFIG[category];
  
  const sizeClasses = {
    sm: 'text-sm px-1.5 py-0.5',
    md: 'text-base px-2 py-1',
    lg: 'text-lg px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted',
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      <span>{config.emoji}</span>
      {showLabel && (
        <span className="text-muted-foreground font-medium">
          {config.label}
        </span>
      )}
    </span>
  );
}
