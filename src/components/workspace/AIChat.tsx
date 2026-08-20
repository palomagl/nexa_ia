import { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Sparkles, Bot, User as UserIcon, FileCode, Package, Terminal as TerminalIcon, Trash, MoreHorizontal,
} from 'lucide-react';
import type { ChatMessage } from '../../types';
import { useStore } from '../../store/useStore';
import { currentUser } from '../../data/mockData';
import { cn, formatDate } from '../../lib/utils';

interface Props {
  projectId: string;
  messages: ChatMessage[];
}

const aiResponses = [
  "I've updated the component. The changes are now visible in the preview.",
  "Done! I created the new file and imported it into your main component.",
  "I've installed the dependency and updated your package.json. The component is ready to use.",
  "Fixed the error. The issue was a missing import statement.",
  "I've made the design responsive. It now adapts to mobile, tablet, and desktop screens.",
  "Created a new API route for your data. You can now fetch and post data.",
  "I've added authentication. Users can now sign up and log in.",
];

export function AIChat({ projectId, messages }: Props) {
  const { addChatMessage, updateChatMessage, addToast, createCheckpoint } = useStore();
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSend = () => {
    if (!input.trim() || thinking) return;
    const userMsg: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content: input.trim(),
      status: 'sent',
    };
    addChatMessage(projectId, userMsg);
    const userText = input.trim();
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      const assistantMsgId = Math.random().toString(36);
      addChatMessage(projectId, { role: 'assistant', content: response, status: 'sent', actions: generateActions(userText) });
      setThinking(false);
      createCheckpoint(projectId, `AI: ${userText.slice(0, 40)}`);
      addToast({ type: 'success', title: 'AI updated your project', message: 'Changes applied to preview' });
    }, 1500 + Math.random() * 1000);
  };

  const generateActions = (prompt: string): ChatMessage['actions'] => {
    const actions: ChatMessage['actions'] = [];
    if (/login|auth|sign/i.test(prompt)) actions.push({ type: 'create_file', label: 'Created Login.tsx', detail: 'Login form component' });
    if (/api|route|endpoint/i.test(prompt)) actions.push({ type: 'create_file', label: 'Created api/route.ts', detail: 'API endpoint' });
    if (/database|postgres|sql|supabase/i.test(prompt)) actions.push({ type: 'install_dep', label: 'Installed @supabase/supabase-js', detail: 'Supabase client' });
    if (/dashboard|admin/i.test(prompt)) actions.push({ type: 'create_file', label: 'Created Dashboard.tsx', detail: 'Dashboard page' });
    if (/respons|mobile|tablet/i.test(prompt)) actions.push({ type: 'edit_file', label: 'Edited index.css', detail: 'Added responsive breakpoints' });
    if (/install|dependenc|package/i.test(prompt)) actions.push({ type: 'install_dep', label: 'Installed package', detail: 'Added to package.json' });
    if (/fix|error|bug/i.test(prompt)) actions.push({ type: 'run_command', label: 'Ran npm run build', detail: 'Build successful' });
    if (actions.length === 0) {
      actions.push({ type: 'edit_file', label: 'Edited App.tsx', detail: 'Applied changes' });
    }
    return actions;
  };

  const actionIcons = {
    create_file: FileCode,
    edit_file: FileCode,
    delete_file: Trash,
    install_dep: Package,
    run_command: TerminalIcon,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-nexa flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">AI Assistant</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] text-white/40">Online</span>
            </div>
          </div>
        </div>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
              msg.role === 'user' ? 'bg-white/5' : 'gradient-nexa'
            )}>
              {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white/60" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={cn('flex-1 min-w-0', msg.role === 'user' && 'flex flex-col items-end')}>
              <div className={cn(
                'rounded-xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-nexa-500/15 text-white rounded-tr-sm'
                  : 'glass text-white/80 rounded-tl-sm'
              )}>
                {msg.content}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.actions.map((action, i) => {
                    const Icon = actionIcons[action.type];
                    return (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                        <Icon className="w-3 h-3 text-nexa-400 flex-shrink-0" />
                        <span className="text-white/70 font-medium">{action.label}</span>
                        <span className="text-white/30">— {action.detail}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <span className="text-[10px] text-white/20 mt-1">{formatDate(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg gradient-nexa flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-nexa-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-nexa-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-nexa-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-white/40">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="glass rounded-xl p-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask AI to modify your project..."
            rows={2}
            className="w-full bg-transparent px-2 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <Paperclip className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-white/40">
                <Sparkles className="w-3.5 h-3.5 text-nexa-400" />
                <span className="text-xs">AI</span>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="btn-primary p-2 rounded-lg disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
