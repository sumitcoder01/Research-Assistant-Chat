import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Moon, Sun, ChevronDown, Check } from 'lucide-react';
import { Theme } from '../types';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions = [
    { 
      value: 'system' as Theme, 
      label: 'System', 
      icon: Monitor,
      description: 'Use system preference'
    },
    { 
      value: 'light' as Theme, 
      label: 'Light', 
      icon: Sun,
      description: 'Light theme'
    },
    { 
      value: 'dark' as Theme, 
      label: 'Dark', 
      icon: Moon,
      description: 'Dark theme'
    },
  ];

  const currentTheme = themeOptions.find(option => option.value === theme);
  const CurrentIcon = currentTheme?.icon || Monitor;

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-white/90 dark:hover:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentTheme?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl dark:shadow-gray-900/50 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Current resolved theme indicator */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Currently using: <span className="font-medium capitalize text-gray-700 dark:text-gray-300">{resolvedTheme}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;