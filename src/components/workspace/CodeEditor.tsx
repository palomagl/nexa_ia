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

  const ext = filename.split('.').pop()?.toLowerCase();
  const lang = language || ext || 'text';

  return (
    <div className="h-full flex flex-col bg-paper-card">
      {/* Barra de abas */}
      <div className="flex items-center justify-between px-3 border-b border-paper-line bg-paper">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 px-3 py-2 font-mono text-xs font-medium text-ink bg-paper-card border-t-2 border-lavender-deep whitespace-nowrap">
            {filename}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink/45 px-2">
          <span className="uppercase">{lang}</span>
          <span>·</span>
          <span>somente leitura</span>
        </div>
      </div>

      {/* Área de código */}
      <div className="flex-1 flex overflow-hidden">
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 py-3 px-3 text-right text-xs text-ink/30 font-mono select-none overflow-hidden bg-paper"
          style={{ minWidth: '48px' }}
        >
          {lines.map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onScroll={handleScroll}
          readOnly
          spellCheck={false}
          className="flex-1 py-3 px-4 bg-paper-card text-sm text-ink/90 font-mono leading-6 resize-none focus:outline-none whitespace-pre overflow-auto"
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-paper-line bg-paper text-[11px] text-ink/45">
        <span>{lines.length} linhas</span>
        <span>{text.length.toLocaleString()} caracteres</span>
      </div>
    </div>
  );
}
