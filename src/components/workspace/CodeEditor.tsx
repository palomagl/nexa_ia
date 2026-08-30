import { useEffect, useRef, useState } from 'react';

interface Props {
  content: string;
  language?: string;
  filename: string;
}

export function CodeEditor({ content, language, filename }: Props) {
  const [text, setText] = useState(content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(content || ''); }, [content]);

  const lines = text.split('\n');

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newText = text.substring(0, start) + '  ' + text.substring(end);
      setText(newText);
      requestAnimationFrame(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
      });
    }
  };

  const ext = filename.split('.').pop()?.toLowerCase();
  const lang = language || ext || 'text';

  return (
    <div className="h-full flex flex-col bg-paper">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-0 border-b border-paper-line bg-paper">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ink bg-paper-card border-t-2 border-lavender-deep cursor-pointer whitespace-nowrap">
            {filename}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-ink/55 px-2">
          <span className="uppercase">{lang}</span>
          <span>·</span>
          <span>UTF-8</span>
          <span>·</span>
          <span>LF</span>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 py-3 px-3 text-right text-xs text-ink/35 font-mono select-none overflow-hidden bg-paper"
          style={{ minWidth: '48px' }}
        >
          {lines.map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 py-3 px-4 bg-transparent text-sm text-ink font-mono leading-6 resize-none focus:outline-none whitespace-pre overflow-auto"
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-paper-line bg-paper text-xs text-ink/45">
        <div className="flex items-center gap-3">
          <span>Ln {lines.length}, Col 1</span>
          <span>Spaces: 2</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{text.length} chars</span>
        </div>
      </div>
    </div>
  );
}
