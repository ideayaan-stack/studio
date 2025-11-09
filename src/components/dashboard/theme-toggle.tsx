'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export function ThemeToggle() {
  // This is a placeholder UI component - actual theme switching will be implemented later
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="theme-toggle" className="text-base">Dark Mode</Label>
          <p className="text-sm text-muted-foreground">
            Switch between light and dark theme. (Coming soon)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch
            id="theme-toggle"
            checked={isDarkMode}
            onCheckedChange={setIsDarkMode}
            disabled
          />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="rounded-lg border p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Theme switching functionality will be implemented in a future update.
        </p>
      </div>
    </div>
  );
}

