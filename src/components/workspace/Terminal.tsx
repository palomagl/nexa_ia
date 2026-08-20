import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Plus, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
}

export function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'NEXA AI Terminal v1.0.0' },
    { type: 'output', content: 'Type "help" for available commands.' },
    { type: 'output', content: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const runCommand = (cmd: string) => {
    const newLines: TerminalLine[] = [...lines, { type: 'input', content: `$ ${cmd}` }];

    const parts = cmd.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const output: string[] = [];
    switch (command) {
      case 'help':
        output.push('Available commands:', '  npm install <pkg>  - Install a package', '  npm run dev        - Start dev server', '  npm run build      - Build the project', '  git status         - Check git status', '  git add <files>    - Stage files', '  git commit -m      - Commit changes', '  clear              - Clear terminal', '  help               - Show this message', '');
        break;
      case 'npm':
        if (args[0] === 'install' || args[0] === 'i') {
          const pkg = args[1] || '';
          if (pkg) {
            output.push(`Installing ${pkg}...`, `added 1 package in 2s`, ``, `✓ ${pkg} installed successfully`);
          } else {
            output.push('Installing dependencies...', 'added 124 packages in 8s', '', '✓ All dependencies installed');
          }
        } else if (args[0] === 'run') {
          if (args[1] === 'dev') output.push('Starting dev server...', '', '  ➜  Local:   http://localhost:5173/', '  ➜  Network: http://192.168.1.100:5173/');
          else if (args[1] === 'build') output.push('Building project...', '', '✓ built in 3.42s', 'dist/index.html   0.46 kB', 'dist/assets/index.css  12.3 kB', 'dist/assets/index.js   287 kB');
          else output.push(`npm: Unknown script "${args[1]}"`);
        } else {
          output.push(`npm: Command "${args[0]}" not found`);
        }
        break;
      case 'git':
        if (args[0] === 'status') output.push('On branch main', 'Changes not staged for commit:', '  modified:   src/App.tsx', '  modified:   src/index.css', '', 'no changes added to commit');
        else if (args[0] === 'add') output.push('');
        else if (args[0] === 'commit') output.push('[main 7a3f2b1] ' + (args[2] || 'Update') + ' 2 files changed, 15 insertions(+), 3 deletions(-)');
        else if (args[0] === 'push') output.push('Enumerating objects: 8, done.', 'Counting objects: 100% (8/8), done.', 'Writing objects: 100% (5/5), 543 bytes', 'To github.com:user/repo.git', '   3f2b1c..7a3f2b  main -> main');
        else if (args[0] === 'pull') output.push('Already up to date.');
        else output.push(`git: '${args[0]}' is not a git command. See 'git --help'.`);
        break;
      case 'clear':
        setLines([]);
        return;
      case '':
        break;
      case 'ls':
        output.push('node_modules/  src/  public/  index.html  package.json  tsconfig.json  vite.config.ts');
        break;
      case 'pwd':
        output.push('/home/user/project');
        break;
      default:
        output.push(`bash: ${command}: command not found`, 'Type "help" for available commands.');
    }
    output.push('');
    setLines([...newLines, ...output.map(c => ({ type: 'output' as const, content: c }))]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(input);
      if (input.trim()) setHistory(h => [...h, input]);
      setHistoryIdx(-1);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const idx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1 && historyIdx < history.length - 1) {
        const idx = historyIdx + 1;
        setHistoryIdx(idx);
        setInput(history[idx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-900 font-mono text-sm" onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-bg-850">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-nexa-400" />
          <span className="text-xs text-white/60">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-white/30 hover:text-white hover:bg-white/5"><Plus className="w-3.5 h-3.5" /></button>
          <button className="p-1 rounded text-white/30 hover:text-white hover:bg-white/5"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button onClick={() => setLines([])} className="p-1 rounded text-white/30 hover:text-white hover:bg-white/5"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'leading-6 whitespace-pre-wrap',
              line.type === 'input' && 'text-nexa-300 font-medium',
              line.type === 'output' && 'text-white/60',
              line.type === 'error' && 'text-red-400'
            )}
          >
            {line.content || '\u00A0'}
          </div>
        ))}
        <div className="flex items-center">
          <span className="text-nexa-300 font-medium mr-2">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoFocus
            className="flex-1 bg-transparent text-white/90 focus:outline-none font-mono"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}
