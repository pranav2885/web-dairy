import { Book, Moon, Sun, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useSyncStatus } from '@/hooks/use-sync-status';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { status, isOnline } = useSyncStatus();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Book className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-xl font-semibold text-foreground">
            Diary Vault
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Status */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {!isOnline ? (
              <WifiOff className="h-4 w-4" />
            ) : status === 'syncing' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : status === 'synced' ? (
              <Wifi className="h-4 w-4 text-primary" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
