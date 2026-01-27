import { Moon, Sun, Wifi, WifiOff, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SoulLogLogo } from '@/components/SoulLogLogo';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { status, isOnline } = useSyncStatus();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
      console.error(error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <SoulLogLogo className="text-foreground" size={36} />
          <h1 className="text-xl font-semibold tracking-wide bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
            SoulLog
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
          {/* <Button
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
          </Button> */}

          {/* Logout Button */}
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
