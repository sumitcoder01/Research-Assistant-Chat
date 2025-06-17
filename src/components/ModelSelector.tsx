import React from 'react';
import { Cpu, Zap } from 'lucide-react';
import { LLMProvider } from '../types';
import { useChatStore } from '../store/chatStore';

const MODEL_OPTIONS: Record<LLMProvider, string[]> = {
  deepseek: ['deepseek-chat' , 'deepseek-coder'],
  openai: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet'],
  gemini: ['gemini-2.0-flash', 'gemini-2.0-pro']
};

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini'
};

const ModelSelector: React.FC = () => {
  const {
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel
  } = useChatStore();

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    // Auto-select first model of the new provider
    const models = MODEL_OPTIONS[provider];
    if (models.length > 0) {
      setSelectedModel(models[0]);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      {/* Provider Selector */}
      <div className="relative">
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
          className="appearance-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer w-full sm:w-auto"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em'
          }}
        >
          {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
            <option key={value} value={value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
          <Cpu className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {/* Model Selector */}
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="appearance-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer min-w-[120px] sm:min-w-[140px] w-full sm:w-auto"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em'
          }}
        >
          {MODEL_OPTIONS[selectedProvider].map((model) => (
            <option key={model} value={model} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {model}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
          <Zap className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;