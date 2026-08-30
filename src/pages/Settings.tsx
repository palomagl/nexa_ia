import { useState } from 'react';
import { User, Building2, Sparkles, Github } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

type SettingsTab = 'account' | 'workspace' | 'ai' | 'github';

export function Settings() {
  const { user, updateUser, workspace, updateWorkspace, addToast } = useStore();
  const [tab, setTab] = useState<SettingsTab>('account');
  const [nameDraft, setNameDraft] = useState(user.name);
  const [emailDraft, setEmailDraft] = useState(user.email);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(workspace.name);

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'github', label: 'GitHub', icon: Github },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-ink mb-6">Settings</h1>

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
                  tab === t.id ? 'bg-lavender-soft text-lavender-ink font-medium' : 'text-ink/60 hover:text-ink hover:bg-ink/[0.05]'
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
                <h2 className="text-lg font-semibold text-ink mb-1">Account</h2>
                <p className="text-sm text-ink/55">Manage your account information</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-lavender flex items-center justify-center text-xl font-bold text-ink">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-ink">{user.name}</p>
                  <p className="text-sm text-ink/55">{user.email}</p>
                  <button onClick={() => addToast({ type: 'info', title: 'Avatar upload coming soon' })} className="text-xs text-lavender-ink mt-1 hover:text-lavender-ink">Change avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-ink/55 mb-1.5 block">Full name</label>
                  <input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="input-base w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-ink/55 mb-1.5 block">Email</label>
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
                <h2 className="text-lg font-semibold text-ink mb-1">Workspace</h2>
                <p className="text-sm text-ink/55">Manage your workspace settings</p>
              </div>
              <div>
                <label className="text-xs text-ink/55 mb-1.5 block">Workspace name</label>
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
                <h2 className="text-lg font-semibold text-ink mb-1">AI Configuration</h2>
                <p className="text-sm text-ink/55">Como a geração de código funciona neste projeto</p>
              </div>
              <div className="p-4 rounded-xl bg-ink/[0.03] border border-paper-line space-y-3">
                <p className="text-sm text-ink/75">
                  O Nexa AI tenta uma cadeia de provedores em ordem — se um estiver
                  indisponível ou sem cota, cai pro próximo automaticamente:
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {['Gemini', 'Groq', 'Mistral'].map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-lavender-soft/70 text-lavender-ink font-medium">{p}</span>
                      {i < arr.length - 1 && <span className="text-ink/35">→</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-ink/55">
                  A ordem e as chaves de cada provedor são definidas em <code className="text-ink/70">server/.env</code>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-ink/[0.03] border border-paper-line">
                <p className="text-sm text-ink/75">
                  ✓ Correção automática de sintaxe está ativa — se um arquivo gerado
                  não compilar, o sistema tenta corrigir antes de te entregar.
                </p>
              </div>
            </div>
          )}

          {tab === 'github' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-ink mb-1">GitHub Integration</h2>
                <p className="text-sm text-ink/55">Connect your GitHub account</p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-ink/[0.03] border border-paper-line">
                <div className="w-10 h-10 rounded-lg bg-ink/[0.05] flex items-center justify-center">
                  <Github className="w-5 h-5 text-ink" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">Nenhuma conta conectada</p>
                  <p className="text-xs text-ink/55">Conecte pra permitir push direto de um projeto pro GitHub</p>
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

        </div>
      </div>
    </div>
  );
}
