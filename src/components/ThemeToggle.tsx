import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      className={cn(
        "relative overflow-hidden",
        "bg-card hover:bg-card-hover border-border",
        "transition-all duration-300"
      )}
    >
      <Sun className={cn(
        "h-5 w-5 transition-all duration-300",
        theme === 'dark' && "rotate-90 scale-0"
      )} />
      <Moon className={cn(
        "absolute h-5 w-5 transition-all duration-300",
        theme === 'light' && "rotate-90 scale-0"
      )} />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}