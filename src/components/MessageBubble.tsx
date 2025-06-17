import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '../types';
import { format } from 'date-fns';
import { useTheme } from '../hooks/useTheme';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const isAI = message.role === 'ai';

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className={`flex gap-3 sm:gap-4 mb-4 sm:mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[85%] sm:max-w-4xl ${!isAI ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-3 sm:px-4 py-3 shadow-sm relative group ${
            isAI
              ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50'
              : 'bg-blue-600 dark:bg-blue-500 text-white'
          }`}
        >
          {/* Copy Message Button */}
          <button
            onClick={handleCopyMessage}
            className={`absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
              isAI 
                ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300' 
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
            title="Copy entire message"
          >
            {copiedMessage ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>

          {isAI ? (
            <div className="prose prose-sm max-w-none dark:prose-invert custom-scrollbar">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeContent = String(children).replace(/\n$/, '');
                    
                    return !inline && match ? (
                      <div className="relative group my-4">
                        <button
                          onClick={() => handleCopyCode(codeContent)}
                          className="absolute top-2 right-2 p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Copy code"
                        >
                          {copiedCode === codeContent ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <div className="overflow-x-auto custom-scrollbar">
                          <SyntaxHighlighter
                            style={resolvedTheme === 'dark' ? tomorrow : prism}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !mt-0 !mb-0 text-sm"
                            {...props}
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <code className={`${className} bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm text-gray-900 dark:text-gray-100`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4 table-container custom-scrollbar">
                        <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 font-semibold text-left text-sm text-gray-900 dark:text-gray-100">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100">
                        {children}
                      </td>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 py-2 rounded-r">
                        {children}
                      </blockquote>
                    );
                  },
                  ul({ children }) {
                    return (
                      <ul className="list-disc list-inside space-y-1 my-3 text-gray-900 dark:text-gray-100">
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="list-decimal list-inside space-y-1 my-3 text-gray-900 dark:text-gray-100">
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return (
                      <li className="text-gray-900 dark:text-gray-100">
                        {children}
                      </li>
                    );
                  },
                  p({ children }) {
                    return (
                      <p className="mb-3 last:mb-0 leading-relaxed text-gray-900 dark:text-gray-100">
                        {children}
                      </p>
                    );
                  },
                  h1({ children }) {
                    return (
                      <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="text-base font-bold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100">
                        {children}
                      </h3>
                    );
                  },
                  h4({ children }) {
                    return (
                      <h4 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100">
                        {children}
                      </h4>
                    );
                  },
                  h5({ children }) {
                    return (
                      <h5 className="text-sm font-semibold mb-2 mt-2 first:mt-0 text-gray-900 dark:text-gray-100">
                        {children}
                      </h5>
                    );
                  },
                  h6({ children }) {
                    return (
                      <h6 className="text-sm font-semibold mb-2 mt-2 first:mt-0 text-gray-900 dark:text-gray-100">
                        {children}
                      </h6>
                    );
                  },
                  strong({ children }) {
                    return (
                      <strong className="font-bold text-gray-900 dark:text-gray-100">
                        {children}
                      </strong>
                    );
                  },
                  em({ children }) {
                    return (
                      <em className="italic text-gray-900 dark:text-gray-100">
                        {children}
                      </em>
                    );
                  },
                  a({ children, href }) {
                    return (
                      <a 
                        href={href} 
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    );
                  },
                  hr() {
                    return (
                      <hr className="my-4 border-gray-300 dark:border-gray-600" />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap pr-8">
              {message.content}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(message.timestamp, 'HH:mm')}
          </span>
        </div>
      </div>

      {!isAI && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;