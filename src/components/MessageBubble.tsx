import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { CSSTransition } from 'react-transition-group';
import { Message } from '../types';
import { format } from 'date-fns';
import { useTheme } from '../hooks/useTheme';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [displayedContent, setDisplayedContent] = useState<string>("");
  const [showBubble, setShowBubble] = useState(false);
  const nodeRef = useRef(null);

  const { resolvedTheme } = useTheme();
  const isAI = message.role === 'ai';

  // Effect for streaming text
  useEffect(() => {
    setShowBubble(true); // Trigger the fade-in animation
    setDisplayedContent(message.content);
  }, [message.content, isAI, message.isLoading, message.isError]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleCopyMessage = async () => {
    if (message.isLoading || message.isError) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy message: ', err);
    }
  };

  // --- RENDER LOADING STATE ---
  if (message.isLoading) {
    return (
      <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6 justify-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full flex items-center justify-center shadow-md">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          </div>
        </div>
        <div className="max-w-full sm:max-w-4xl">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CSSTransition
      in={showBubble}
      timeout={300}
      classNames="message-bubble"
      unmountOnExit
      nodeRef={nodeRef}
    >
      <div ref={nodeRef} className={`flex gap-3 sm:gap-4 mb-4 sm:mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
        {/* AI Avatar (with error state) */}
        {isAI && (
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
              message.isError
                ? 'bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500'
            }`}>
              {message.isError
                ? <AlertTriangle className="w-4 h-4 text-white" />
                : <Bot className="w-4 h-4 text-white" />
              }
            </div>
          </div>
        )}
        
        {/* Message Content Bubble */}
        <div className={`max-w-[85%] sm:max-w-4xl ${!isAI ? 'order-first' : ''}`}>
          <div
            className={`rounded-2xl px-3 sm:px-4 py-3 shadow-sm relative group ${
              isAI
                ? message.isError
                  ? 'bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50 text-red-800 dark:text-red-200'
                  : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50'
                : 'bg-blue-600 dark:bg-blue-500 text-white'
            }`}
          >
            {/* Copy Message Button */}
            {!message.isLoading && !message.isError && (
              <button
                onClick={handleCopyMessage}
                className={`absolute top-1 right-1 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                  isAI 
                    ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300' 
                    : 'bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-blue-100'
                }`}
                title="Copy message text"
                aria-label="Copy message text"
              >
                {copiedMessage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            )}

            {isAI ? (
              <div className={`prose prose-sm max-w-none dark:prose-invert custom-scrollbar ${message.isError ? 'prose-p:text-red-800 dark:prose-p:text-red-200' : ''}`}>
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
                            aria-label="Copy code block"
                          >
                            {copiedCode === codeContent ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <div className="overflow-x-auto custom-scrollbar">
                            <SyntaxHighlighter
                              style={resolvedTheme === 'dark' ? tomorrow as { [key: string]: CSSProperties } : prism as { [key: string]: CSSProperties }}
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
                        <code className={`${className || ''} bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm text-gray-900 dark:text-gray-100`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table: ({ children }) => <div className="overflow-x-auto my-4 table-container custom-scrollbar"><table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">{children}</table></div>,
                    th: ({ children }) => <th className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 font-semibold text-left text-sm text-gray-900 dark:text-gray-100">{children}</th>,
                    td: ({ children }) => <td className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100">{children}</td>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 py-2 rounded-r">{children}</blockquote>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-3 text-gray-900 dark:text-gray-100">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-3 text-gray-900 dark:text-gray-100">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-900 dark:text-gray-100">{children}</li>,
                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-900 dark:text-gray-100">{children}</p>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm font-semibold mb-2 mt-2 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h5>,
                    h6: ({ children }) => <h6 className="text-sm font-semibold mb-2 mt-2 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h6>,
                    strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-900 dark:text-gray-100">{children}</em>,
                    a: ({ children, href }) => <a href={href} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                    hr: () => <hr className="my-4 border-gray-300 dark:border-gray-600" />,
                  }}
                >
                  {displayedContent}
                </ReactMarkdown>
              </div>
            ) : ( // Human message
              <p className="text-sm leading-relaxed whitespace-pre-wrap pr-8 sm:pr-10">
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

        {/* Human Avatar */}
        {!isAI && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </CSSTransition>
  );
};

export default MessageBubble;