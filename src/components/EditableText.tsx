import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { SmartVariable, resolveVariables } from '../types';
import { FileText, ExternalLink } from 'lucide-react';

export const VariablesContext = createContext<SmartVariable[]>([]);

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  fontSize?: string;
  onFontSizeChange?: (size: string) => void;
  variables?: SmartVariable[];
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '24px', '32px', '40px', '48px', '60px'];

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = '',
  multiline = false,
  placeholder = 'Type here...',
  fontSize,
  onFontSizeChange,
  variables
}) => {
  const contextVars = useContext(VariablesContext);
  const activeVariables = variables && variables.length > 0 ? variables : contextVars;
  
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.setSelectionRange(localValue.length, localValue.length);
      }
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const handleInsertLink = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = textarea.value;
    const linkTemplate = `[Link Text](https://)`;
    
    const newValue = text.substring(0, start) + linkTemplate + text.substring(end);
    setLocalValue(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 10);
    }, 0);
  };

  const handleInsertImage = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = textarea.value;
    const imageTemplate = `![Corporate Office Workspace](https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80)`;
    
    const newValue = text.substring(0, start) + imageTemplate + text.substring(end);
    setLocalValue(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 29);
    }, 0);
  };

  const handleInsertVideo = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = textarea.value;
    const videoTemplate = `![Product Video Demo](https://www.w3schools.com/html/mov_bbb.mp4)`;
    
    const newValue = text.substring(0, start) + videoTemplate + text.substring(end);
    setLocalValue(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 20);
    }, 0);
  };

  const handleInsertFile = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = textarea.value;
    const fileTemplate = `[Proposal Specs Appendix.pdf](https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf)`;
    
    const newValue = text.substring(0, start) + fileTemplate + text.substring(end);
    setLocalValue(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 28);
    }, 0);
  };

  const combinedClassName = `w-full bg-transparent outline-none ring-0 border-transparent focus:border-transparent focus:ring-0 resize-none ${className}`;

  if (isEditing) {
    return (
      <div className="relative w-full">
        {(onFontSizeChange || multiline) && (
          <div className="absolute -top-10 left-0 flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-md z-30 no-print">
            {onFontSizeChange && (
              <>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const currentIndex = FONT_SIZES.indexOf(fontSize || '16px');
                    const nextIndex = Math.max(currentIndex - 1, 0);
                    onFontSizeChange?.(FONT_SIZES[nextIndex]);
                  }}
                  className="px-2 py-0.5 hover:bg-gray-100 rounded text-xs font-bold text-gray-500 cursor-pointer"
                  title="Decrease Font Size"
                >
                  A-
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onFontSizeChange?.('16px');
                  }}
                  className="px-2 py-0.5 hover:bg-gray-100 rounded text-xs font-bold text-gray-700 cursor-pointer"
                  title="Reset Font Size"
                >
                  A
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const currentIndex = FONT_SIZES.indexOf(fontSize || '16px');
                    const nextIndex = Math.min(currentIndex + 1, FONT_SIZES.length - 1);
                    onFontSizeChange?.(FONT_SIZES[nextIndex]);
                  }}
                  className="px-2 py-0.5 hover:bg-gray-100 rounded text-xs font-bold text-gray-900 cursor-pointer"
                  title="Increase Font Size"
                >
                  A+
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1" />
              </>
            )}
            {/* Inline insertions removed in favor of dedicated block structures */}
          </div>
        )}
        
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={combinedClassName + " overflow-hidden block"}
            rows={1}
            style={{ height: 'auto', minHeight: '1.5em', fontSize }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={combinedClassName + " block"}
            style={{ fontSize }}
          />
        )}
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-100/50 hover:ring-1 hover:ring-gray-200 rounded px-1 -mx-1 transition-colors min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 inline-block whitespace-pre-wrap ${className}`}
      data-placeholder={placeholder}
      style={{ fontSize }}
    >
      <MarkdownRenderer text={value} variables={activeVariables} />
    </span>
  );
};

export const MarkdownRenderer: React.FC<{ text: string; variables?: SmartVariable[] }> = ({ text, variables }) => {
  const contextVars = useContext(VariablesContext);
  const activeVariables = variables && variables.length > 0 ? variables : contextVars;
  const resolved = resolveVariables(text || '', activeVariables);
  
  if (!resolved) return null;

  const lines = resolved.split('\n');
  
  return (
    <div className="space-y-1.5 w-full text-left">
      {lines.map((line, lineIdx) => {
        // 1. Check for Image markdown: `![caption](url)`
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let imgMatch = imgRegex.exec(line);
        if (imgMatch) {
          const caption = imgMatch[1];
          const url = imgMatch[2];
          
          const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg') || caption.toLowerCase().includes('video');
          if (isVideo) {
            return (
              <div key={lineIdx} className="my-3 w-full no-print">
                <video src={url} controls className="max-h-72 w-full rounded-xl bg-black shadow-sm" />
                {caption && caption !== 'Video' && <span className="text-[10px] text-gray-400 block mt-1 text-center italic">{caption}</span>}
              </div>
            );
          }
          
          return (
            <div key={lineIdx} className="my-3 w-full">
              <img src={url} alt={caption} className="max-h-72 w-auto max-w-full rounded-xl object-cover shadow-sm border border-gray-100" />
              {caption && <span className="text-[10px] text-gray-400 block mt-1 italic">{caption}</span>}
            </div>
          );
        }

        // 2. Check for File download: `[file:Filename](url)` or `[Document Name](url)` ending in .pdf/.zip etc.
        const fileRegex = /\[([^\]]+)\]\(([^)]+\.(pdf|zip|docx|xlsx|pptx|png|jpg|jpeg))\)/gi;
        let fileMatch = fileRegex.exec(line);
        if (fileMatch) {
          const fileName = fileMatch[1];
          const url = fileMatch[2];
          return (
            <a 
              key={lineIdx}
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl my-2 max-w-sm cursor-pointer no-underline text-gray-800 transition-all hover:shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                <FileText size={20} />
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-bold text-gray-900 truncate">{fileName}</span>
                <span className="block text-[9px] text-gray-400 uppercase font-semibold tracking-wider mt-0.5">Click to Open File</span>
              </div>
            </a>
          );
        }

        // 3. Standard Link parser: `[link text](url)`
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let lastIndex = 0;
        const parts: (string | React.ReactNode)[] = [];
        let match;
        
        while ((match = linkRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
          }
          
          const linkText = match[1];
          const linkUrl = match[2];
          
          parts.push(
            <a 
              key={match.index}
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer inline flex-inline items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {linkText}
              <ExternalLink size={10} className="inline ml-0.5 opacity-60" />
            </a>
          );
          
          lastIndex = linkRegex.lastIndex;
        }
        
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex));
        }

        return (
          <span key={lineIdx} className="block min-h-[1.2em]">
            {parts.length > 0 ? parts : line}
          </span>
        );
      })}
    </div>
  );
};
