import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Mic, Paperclip, Sparkles, ArrowRight, Globe, Layout, BarChart3, Layers,
  FileArchive, Star, MoreVertical, Clock, Share2,
} from 'lucide-react';
import { FigmaIcon as Figma, GithubIcon as Github } from '../components/ui/CustomIcons';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../lib/utils';
import { Dropdown } from '../components/ui/Dropdown';
import type { ProjectType } from '../types';

export function Home() {
  const navigate = useNavigate();
  const { projects, createProject, toggleStar, addToast } = useStore();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    const id = createProject(prompt.trim());
    addToast({ type: 'loading', title: 'AI is building your project', message: 'Setting up files and components...' });
    setTimeout(() => {
      setGenerating(false);
      setPrompt('');
      navigate(`/project/${id}`);
    }, 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const quickStarts: { icon: typeof Globe; label: string; desc: string; type: ProjectType; gradient: string }[] = [
    { icon: Globe, label: 'Website', desc: 'Create a beautiful website', type: 'website', gradient: 'from-nexa-600 to-violet-500' },
    { icon: Layout, label: 'App', desc: 'Build a web application', type: 'app', gradient: 'from-violet-600 to-nexa-400' },
    { icon: BarChart3, label: 'Dashboard', desc: 'Create admin dashboards', type: 'dashboard', gradient: 'from-nexa-500 to-violet-600' },
    { icon: Layers, label: 'Prototype', desc: 'Quick interactive prototype', type: 'prototype', gradient: 'from-violet-400 to-nexa-500' },
  ];

  const imports = [
    { icon: Figma, label: 'Figma', color: 'text-pink-400' },
    { icon: Github, label: 'GitHub', color: 'text-white/60' },
    { icon: FileArchive, label: 'ZIP', color: 'text-amber-400' },
  ];

  const recentProjects = projects.slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nexa-500/10 border border-nexa-500/20 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-nexa-400" />
          <span className="text-xs font-medium text-nexa-300">Powered by NEXA AI</span>
        </div>
        <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 text-balance">
          What will you <span className="gradient-text">build</span> today?
        </h1>
        <p className="text-white/50 text-base lg:text-lg">Create websites and apps by chatting with AI.</p>
      </div>

      {/* Prompt Box */}
      <div className="relative max-w-3xl mx-auto mb-8 animate-slide-up">
        <div className="absolute inset-0 gradient-nexa opacity-20 blur-2xl rounded-3xl" />
        <div className="relative glass-strong rounded-2xl p-2 shadow-2xl">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={4}
            className="w-full bg-transparent px-4 py-3 text-white placeholder:text-white/30 focus:outline-none resize-none text-[15px]"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Add file">
                <Plus className="w-[18px] h-[18px]" />
              </button>
              <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Attach">
                <Paperclip className="w-[18px] h-[18px]" />
              </button>
              <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Voice">
                <Mic className="w-[18px] h-[18px]" />
              </button>
              <div className="h-4 w-px bg-white/10 mx-1" />
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                <div className="w-2 h-2 rounded-full bg-green-400 glow-dot" />
                <span className="text-xs text-white/50">AI Ready</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-outline text-sm py-2 px-3 hidden sm:flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Plan
              </button>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-white/30 mt-3">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40">Enter</kbd> to generate
        </p>
      </div>

      {/* Quick Start */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-10">
        {quickStarts.map((qs, i) => (
          <button
            key={qs.label}
            onClick={() => {
              setPrompt(`Create a ${qs.label.toLowerCase()}: `);
              textareaRef.current?.focus();
            }}
            className="group relative glass rounded-2xl p-5 text-left card-hover animate-slide-up overflow-hidden"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 transition-transform group-hover:scale-110', qs.gradient)}>
              <qs.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-0.5">{qs.label}</h3>
            <p className="text-xs text-white/40">{qs.desc}</p>
            <div className="absolute inset-0 bg-gradient-to-t from-nexa-500/0 to-nexa-500/0 group-hover:from-nexa-500/5 transition-all duration-300 pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Import */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-sm text-white/40 font-medium">Import from</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="flex items-center justify-center gap-3">
          {imports.map(imp => (
            <button
              key={imp.label}
              onClick={() => addToast({ type: 'info', title: `Import from ${imp.label}`, message: 'This feature will be available soon.' })}
              className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl hover:border-nexa-500/30 transition-all card-hover"
            >
              <imp.icon className={cn('w-4 h-4', imp.color)} />
              <span className="text-sm text-white/70">{imp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Recent Projects</h2>
          <button onClick={() => navigate('/projects')} className="text-sm text-nexa-400 hover:text-nexa-300 transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {recentProjects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="group flex-shrink-0 w-72 glass rounded-2xl overflow-hidden card-hover cursor-pointer"
            >
              <div className={cn('h-36 bg-gradient-to-br relative overflow-hidden', p.previewGradient)}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="glass-strong rounded-lg p-2.5">
                    <div className="h-1.5 w-3/4 bg-white/20 rounded mb-1.5" />
                    <div className="h-1.5 w-1/2 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md',
                    p.status === 'live' && 'bg-green-500/20 text-green-300',
                    p.status === 'building' && 'bg-nexa-500/20 text-nexa-300',
                    p.status === 'draft' && 'bg-white/10 text-white/60',
                    p.status === 'error' && 'bg-red-500/20 text-red-300'
                  )}>
                    {p.status}
                  </span>
                </div>
                {p.starred && <Star className="absolute top-3 left-3 w-4 h-4 text-amber-400 fill-amber-400" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate">{p.name}</h3>
                    <p className="text-xs text-white/40 truncate mt-0.5">{p.description}</p>
                  </div>
                  <Dropdown
                    items={[
                      { label: 'Open', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => navigate(`/project/${p.id}`) },
                      { label: p.starred ? 'Unstar' : 'Star', icon: <Star className="w-3.5 h-3.5" />, onClick: () => toggleStar(p.id) },
                      { label: 'Share', icon: <Share2 className="w-3.5 h-3.5" />, onClick: () => addToast({ type: 'info', title: 'Share link copied' }) },
                      { label: 'Delete', icon: <MoreVertical className="w-3.5 h-3.5" />, danger: true, onClick: () => addToast({ type: 'info', title: 'Project deleted' }) },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-white/30">
                  <span className="capitalize">{p.type}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(p.lastModified)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
