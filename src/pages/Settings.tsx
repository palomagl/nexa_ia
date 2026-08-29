import { useState } from 'react';
import {
  User, Building2, Sparkles, Github, Palette, Bell,
  Moon, Sun, Monitor,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

type SettingsTab = 'account' | 'workspace' | 'ai' | 'github' | 'appearance' | 'notifications';

export function Settings() {
  const { theme, toggleTheme, accentColor, setAccentColor, user, updateUser, workspace, updateWorkspace, addToast } = useStore();
  const [tab, setTab] = useState<SettingsTab>('account');
  const [nameDraft, setNameDraft] = useState(user.name);
  const [emailDraft, setEmailDraft] = useState(user.email);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(workspace.name);

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="glass rounded-xl p-2 flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap',
                  tab === t.id ? 'bg-nexa-500/15 text-nexa-300 font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <t.icon className="w-4 h-4 flex-shrink-0" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 glass rounded-2xl p-6">
          {tab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Account</h2>
                <p className="text-sm text-white/40">Manage your account information</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nexa-600 to-violet-500 flex items-center justify-center text-xl font-bold text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-sm text-white/40">{user.email}</p>
                  <button onClick={() => addToast({ type: 'info', title: 'Avatar upload coming soon' })} className="text-xs text-nexa-400 mt-1 hover:text-nexa-300">Change avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Full name</label>
                  <input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="input-base w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                  <input value={emailDraft} onChange={e => setEmailDraft(e.target.value)} className="input-base w-full text-sm" />
                </div>
              </div>
              <button
                onClick={() => {
                  updateUser({ name: nameDraft.trim() || user.name, email: emailDraft.trim() || user.email });
                  addToast({ type: 'success', title: 'Account updated' });
                }}
                className="btn-primary"
              >
                Save changes
              </button>
            </div>
          )}

          {tab === 'workspace' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Workspace</h2>
                <p className="text-sm text-white/40">Manage your workspace settings</p>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Workspace name</label>
                <input value={workspaceNameDraft} onChange={e => setWorkspaceNameDraft(e.target.value)} className="input-base w-full text-sm" />
              </div>
              <button
                onClick={() => {
                  updateWorkspace({ name: workspaceNameDraft.trim() || workspace.name });
                  addToast({ type: 'success', title: 'Workspace updated' });
                }}
                className="btn-primary"
              >
                Save changes
              </button>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">AI Configuration</h2>
                <p className="text-sm text-white/40">Como a geração de código funciona neste projeto</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <p className="text-sm text-white/70">
                  O Nexa AI tenta uma cadeia de provedores em ordem — se um estiver
                  indisponível ou sem cota, cai pro próximo automaticamente:
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {['Gemini', 'Groq', 'Mistral'].map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-nexa-500/10 text-nexa-300 font-medium">{p}</span>
                      {i < arr.length - 1 && <span className="text-white/20">→</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-white/40">
                  A ordem e as chaves de cada provedor são definidas em <code className="text-white/60">server/.env</code>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-sm text-white/70">
                  ✓ Correção automática de sintaxe está ativa — se um arquivo gerado
                  não compilar, o sistema tenta corrigir antes de te entregar.
                </p>
              </div>
            </div>
          )}

          {tab === 'github' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">GitHub Integration</h2>
                <p className="text-sm text-white/40">Connect your GitHub account</p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Nenhuma conta conectada</p>
                  <p className="text-xs text-white/40">Conecte pra permitir push direto de um projeto pro GitHub</p>
                </div>
                <button
                  onClick={() => addToast({ type: 'info', title: 'Em breve', message: 'A integração com GitHub ainda está em desenvolvimento.' })}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Appearance</h2>
                <p className="text-sm text-white/40">Customize the look and feel</p>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', icon: Moon, available: true },
                    { id: 'light', label: 'Light', icon: Sun, available: false },
                    { id: 'system', label: 'System', icon: Monitor, available: false },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      disabled={!opt.available}
                      onClick={() => {
                        if (opt.id === 'dark' && theme !== 'dark') toggleTheme();
                      }}
                      title={opt.available ? undefined : 'Em breve'}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                        !opt.available && 'opacity-40 cursor-not-allowed',
                        opt.available && theme === 'dark' && opt.id === 'dark'
                          ? 'border-nexa-500/40 bg-nexa-500/10'
                          : 'border-white/5',
                        opt.available && 'hover:border-white/10'
                      )}
                    >
                      <opt.icon className="w-5 h-5 text-white/60" />
                      <span className="text-sm text-white/70">{opt.label}</span>
                      {!opt.available && <span className="text-[10px] text-white/30">Em breve</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block">Accent color</label>
                <div className="flex gap-3">
                  {[
                    { id: 'roxo' as const, swatch: '#9333ea', label: 'Roxo Nexa' },
                    { id: 'violeta' as const, swatch: '#8b5cf6', label: 'Violeta' },
                    { id: 'ameixa' as const, swatch: '#a855f7', label: 'Ameixa' },
                    { id: 'profundo' as const, swatch: '#6366f1', label: 'Roxo Profundo' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setAccentColor(opt.id);
                        addToast({ type: 'success', title: `Cor alterada para ${opt.label}` });
                      }}
                      title={opt.label}
                      className={cn(
                        'w-10 h-10 rounded-xl border-2 transition-all',
                        accentColor === opt.id ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      )}
                      style={{ background: opt.swatch }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Notifications</h2>
                <p className="text-sm text-white/40">Manage your notification preferences</p>
              </div>
              <div className="space-y-3">
                {['Build completed', 'Deploy successful', 'AI suggestions', 'Shared project updates', 'Weekly summary'].map(opt => (
                  <label key={opt} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                    <span className="text-sm text-white/70">{opt}</span>
                    <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-nexa-500" />
                  </label>
                ))}
              </div>
              <button onClick={() => addToast({ type: 'success', title: 'Notification preferences saved' })} className="btn-primary">Save changes</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
