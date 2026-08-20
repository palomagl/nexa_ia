import { useState } from 'react';
import {
  User, Building2, Sparkles, Github, Palette, Bell, Key, CreditCard,
  Check, Moon, Sun, Monitor, Trash2, Copy, Plus,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { currentUser, currentWorkspace } from '../data/mockData';

type SettingsTab = 'account' | 'workspace' | 'ai' | 'github' | 'appearance' | 'notifications' | 'apikeys' | 'billing';

export function Settings() {
  const { theme, toggleTheme, addToast } = useStore();
  const [tab, setTab] = useState<SettingsTab>('account');

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'apikeys', label: 'API Keys', icon: Key },
    { id: 'billing', label: 'Billing', icon: CreditCard },
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
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-white">{currentUser.name}</p>
                  <p className="text-sm text-white/40">{currentUser.email}</p>
                  <button onClick={() => addToast({ type: 'info', title: 'Avatar upload coming soon' })} className="text-xs text-nexa-400 mt-1 hover:text-nexa-300">Change avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Full name</label>
                  <input defaultValue={currentUser.name} className="input-base w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                  <input defaultValue={currentUser.email} className="input-base w-full text-sm" />
                </div>
              </div>
              <button onClick={() => addToast({ type: 'success', title: 'Account updated' })} className="btn-primary">Save changes</button>
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
                <input defaultValue={currentWorkspace.name} className="input-base w-full text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Workspace URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/40">nexa.ai/</span>
                  <input defaultValue="paloma" className="input-base flex-1 text-sm" />
                </div>
              </div>
              <button onClick={() => addToast({ type: 'success', title: 'Workspace updated' })} className="btn-primary">Save changes</button>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">AI Configuration</h2>
                <p className="text-sm text-white/40">Configure AI model and behavior</p>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Model</label>
                <select className="input-base w-full text-sm">
                  <option>NEXA AI Pro</option>
                  <option>NEXA AI Standard</option>
                  <option>GPT-4 Turbo</option>
                  <option>Claude 3.5 Sonnet</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Temperature: 0.7</label>
                <input type="range" min="0" max="100" defaultValue="70" className="w-full accent-nexa-500" />
              </div>
              <div className="space-y-2">
                {['Auto-save changes', 'Show AI suggestions', 'Auto-fix build errors'].map(opt => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-nexa-500" />
                    <span className="text-sm text-white/70">{opt}</span>
                  </label>
                ))}
              </div>
              <button onClick={() => addToast({ type: 'success', title: 'AI settings saved' })} className="btn-primary">Save changes</button>
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
                  <p className="text-sm font-medium text-white">Connected as @paloma-garcia</p>
                  <p className="text-xs text-white/40">12 repositories linked</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-green-500/15 text-green-300 text-xs">Connected</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-nexa-500" />
                  <span className="text-sm text-white/70">Auto-commit on AI changes</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded border-white/20 bg-white/5 text-nexa-500" />
                  <span className="text-sm text-white/70">Create branch for each project</span>
                </label>
              </div>
              <button onClick={() => addToast({ type: 'success', title: 'GitHub settings saved' })} className="btn-primary">Save changes</button>
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
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'system', label: 'System', icon: Monitor },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { if (opt.id !== theme) toggleTheme(); }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                        (theme === 'dark' && opt.id === 'dark') || (theme === 'light' && opt.id === 'light')
                          ? 'border-nexa-500/40 bg-nexa-500/10' : 'border-white/5 hover:border-white/10'
                      )}
                    >
                      <opt.icon className="w-5 h-5 text-white/60" />
                      <span className="text-sm text-white/70">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block">Accent color</label>
                <div className="flex gap-3">
                  {['#9333ea', '#8b5cf6', '#a875ff', '#7e22ce'].map(color => (
                    <button key={color} className={cn('w-10 h-10 rounded-xl border-2 transition-all', color === '#9333ea' ? 'border-white scale-110' : 'border-transparent hover:scale-105')} style={{ background: color }} />
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

          {tab === 'apikeys' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">API Keys</h2>
                <p className="text-sm text-white/40">Manage your API keys for integrations</p>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Production Key', key: 'nexa_sk_••••••••••••4f2a', created: 'Jan 12, 2026' },
                  { name: 'Development Key', key: 'nexa_sk_••••••••••••9a3b', created: 'Feb 03, 2026' },
                ].map(k => (
                  <div key={k.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">{k.name}</p>
                      <p className="text-xs text-white/40 font-mono">{k.key}</p>
                      <p className="text-[10px] text-white/20 mt-0.5">Created {k.created}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => addToast({ type: 'info', title: 'Key copied to clipboard' })} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => addToast({ type: 'success', title: 'New API key generated' })} className="btn-outline flex items-center gap-2">
                <Plus className="w-4 h-4" /> Generate new key
              </button>
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Billing</h2>
                <p className="text-sm text-white/40">Manage your subscription and billing</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-nexa-500/10 to-violet-500/5 border border-nexa-500/15">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/40">Current plan</p>
                    <p className="text-2xl font-bold gradient-text">Free Plan</p>
                  </div>
                  <button className="btn-primary">Upgrade to Pro</button>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-white/40">Projects</p>
                    <p className="text-lg font-semibold text-white">3 / 5</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">AI requests</p>
                    <p className="text-lg font-semibold text-white">127 / 500</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Storage</p>
                    <p className="text-lg font-semibold text-white">1.2 / 5 GB</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Free', price: '$0', features: ['5 projects', '500 AI requests', '5GB storage'], current: true },
                  { name: 'Pro', price: '$20', features: ['Unlimited projects', '10k AI requests', '50GB storage', 'Custom domains'], current: false },
                  { name: 'Team', price: '$50', features: ['Everything in Pro', '100k AI requests', '500GB storage', 'Team collaboration'], current: false },
                ].map(plan => (
                  <div key={plan.name} className={cn('p-4 rounded-xl border', plan.current ? 'border-nexa-500/30 bg-nexa-500/5' : 'border-white/5')}>
                    <p className="font-semibold text-white">{plan.name}</p>
                    <p className="text-2xl font-bold text-white mt-1">{plan.price}<span className="text-sm text-white/40 font-normal">/mo</span></p>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-nexa-400" /> {f}
                        </li>
                      ))}
                    </ul>
                    {!plan.current && <button onClick={() => addToast({ type: 'info', title: `Upgrade to ${plan.name}` })} className="btn-outline w-full mt-4 text-xs">Choose {plan.name}</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
