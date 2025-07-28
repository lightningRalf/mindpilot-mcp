import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDarkMode: boolean;
}

export function SearchBar({ value, onChange, placeholder = "Search artifacts...", isDarkMode }: SearchBarProps) {
  return (
    <div className={`border-b px-4 py-2 ${isDarkMode ? 'bg-neutral-700/30 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-8 pr-8 py-1.5 text-sm rounded ${
            isDarkMode
              ? 'bg-neutral-800 text-neutral-100 border-neutral-600'
              : 'bg-white text-neutral-900 border-neutral-300'
          } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
