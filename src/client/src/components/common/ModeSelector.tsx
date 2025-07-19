import { ChevronDown, HardDrive, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModeSelectorProps {
  isDarkMode: boolean;
  currentMode: 'local' | 'cloud';
  onModeChange: (mode: 'local' | 'cloud') => void;
}

export function ModeSelector({ isDarkMode, currentMode, onModeChange }: ModeSelectorProps) {
  const modes = [
    { value: 'local' as const, label: 'Local Mode', icon: HardDrive },
    { value: 'cloud' as const, label: 'Team Mode', icon: Users },
  ];

  const currentModeData = modes.find(mode => mode.value === currentMode);
  const CurrentIcon = currentModeData?.icon || HardDrive;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3 h-8 rounded text-sm font-medium transition-colors ${
            isDarkMode
              ? 'hover:bg-neutral-700 text-neutral-200'
              : 'hover:bg-neutral-100 text-neutral-700'
          }`}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentModeData?.label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={isDarkMode
          ? "bg-neutral-800 border-neutral-700 text-neutral-100"
          : "bg-white border-neutral-200 text-neutral-900"
        }
      >
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              className={`${
                currentMode === mode.value
                  ? isDarkMode
                    ? 'bg-neutral-700 text-neutral-100'
                    : 'bg-neutral-100 text-neutral-900'
                  : ''
              } ${
                isDarkMode
                  ? "hover:bg-neutral-700 focus:bg-neutral-700"
                  : "hover:bg-neutral-100 focus:bg-neutral-100"
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {mode.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
