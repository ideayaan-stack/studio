'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme-toggle" className="text-base">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark theme.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch id="theme-toggle" disabled />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const isDarkMode = theme === 'dark';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="theme-toggle" className="text-sm sm:text-base">Dark Mode</Label>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Switch between light and dark theme.
          </p>
        </div>
        <div className="flex items-center gap-3 min-h-[44px]">
          <Sun className={cn('h-4 w-4 sm:h-5 sm:w-5', isDarkMode ? 'text-muted-foreground' : 'text-foreground')} />
          <Switch
            id="theme-toggle"
            checked={isDarkMode}
            onCheckedChange={(checked) => {
              setTheme(checked ? 'dark' : 'light');
            }}
            className="scale-110 sm:scale-100"
          />
          <Moon className={cn('h-4 w-4 sm:h-5 sm:w-5', isDarkMode ? 'text-foreground' : 'text-muted-foreground')} />
        </div>
      </div>
      <div className="rounded-lg border p-3 sm:p-4 bg-muted/50">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Current theme: <span className="font-medium">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </p>
      </div>
    </div>
  );
}

