import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DiaryEntry } from '@/lib/db';
import { MoodBadge } from './MoodBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EntryCardProps {
  entry: DiaryEntry;
  onClick?: () => void;
  className?: string;
}

export function EntryCard({ entry, onClick, className }: EntryCardProps) {
  const displayMood = entry.userMood ?? entry.autoMood;
  const title = entry.plaintextTitle || 'Untitled';
  const content = entry.plaintextContent || '';
  const preview = content.length > 150 ? content.slice(0, 150) + '...' : content;

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        'bg-card border-border hover:border-primary/50',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-card-foreground truncate">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(entry.createdAt), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {displayMood && (
            <MoodBadge category={displayMood.category} size="sm" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {preview || 'No content yet...'}
        </p>
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {entry.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{entry.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
