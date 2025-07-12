import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDarkMode: boolean;
}

export function SearchBar({ value, onChange, placeholder = "Search diagrams...", isDarkMode }: SearchBarProps) {
  return (
    <div className={`border-b px-4 py-2 ${isDarkMode ? 'bg-gray-700/30 border-gray-700' : 'bg-neutral-100 border-gray-200'}`}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-8 pr-8 py-1.5 text-sm rounded ${
            isDarkMode
              ? 'bg-gray-800 text-gray-100 border-gray-600'
              : 'bg-white text-gray-900 border-gray-300'
          } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}