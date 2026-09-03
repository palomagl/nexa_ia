import { useState } from 'react';
import { User, Building2, Sparkles, Github } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Star } from '../components/ui/Doodles';

type SettingsTab = 'account' | 'workspace' | 'ai' | 'github';

export function Settings() {
  const { user, updateUser, workspace, updateWorkspace, addToast } = useStore();
  const [tab, setTab] = useState<SettingsTab>('account');
  const [nameDraft, setNameDraft] = useState(user.name);
  const [emailDraft, setEmailDraft] = useState(user.email);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(workspace.name);

  const tabs: { id: SettingsTab; label: string; icon: typeof User; soon?: boolean }[] = [
    { id: 'account', label: 'Conta', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'ai', label: 'IA', icon: Sparkles },
    { id: 'github', label: 'GitHub', icon: Github, soon: true },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink doodle-underline">Configurações</h1>
        <Star size={14} fill className="text-lavender-deep/70 mb-1" rotate={-10} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Abas */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="paper-card p-2 flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display transition-all whitespace-nowrap',
                  tab === t.id ? 'bg-lavender-soft text-lavender-ink font-medium' : 'text-ink/60 hover:text-ink hover:bg-ink/[0.05]'
                )}
              >
                <t.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{t.label}</span>
                {t.soon && (
                  <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-paper-sunken text-ink/45 font-sans">
                    em breve
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 paper-card p-6">
          {tab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink mb-1">Conta</h2>
                <p className="text-sm text-ink/55">Suas informações de perfil</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-lavender flex items-center justify-center text-xl font-display font-semibold text-lavender-ink">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-ink">{user.name}</p>
                  <p className="text-sm text-ink/55">{user.email}</p>
                  <button onClick={() => addToast({ type: 'info', title: 'Upload de avatar em breve' })} className="text-xs text-lavender-ink mt-1 hover:text-lavender-deep">Trocar avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-ink/55 mb-1.5 block">Nome</label>
                  <input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="input-base w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-ink/55 mb-1.5 block">E-mail</label>
                  <input value={emailDraft} onChange={e => setEmailDraft(e.target.value)} className="input-base w-full text-sm" />
                </div>
              </div>
              <button
                onClick={() => {
                  updateUser({ name: nameDraft.trim() || user.name, email: emailDraft.trim() || user.email });
                  addToast({ type: 'success', title: 'Conta atualizada' });
                }}
                className="btn-primary"
              >
                Salvar
              </button>
            </div>
          )}

          {tab === 'workspace' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink mb-1">Workspace</h2>
                <p className="text-sm text-ink/55">Ajustes do seu espaço de trabalho</p>
              </div>
              <div>
                <label className="text-xs text-ink/55 mb-1.5 block">Nome do workspace</label>
                <input value={workspaceNameDraft} onChange={e => setWorkspaceNameDraft(e.target.value)} className="input-base w-full text-sm" />
              </div>
              <button
                onClick={() => {
                  updateWorkspace({ name: workspaceNameDraft.trim() || workspace.name });
                  addToast({ type: 'success', title: 'Workspace atualizado' });
                }}
                className="btn-primary"
              >
                Salvar
              </button>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink mb-1">Configuração da IA</h2>
                <p className="text-sm text-ink/55">Como a geração de código funciona neste projeto</p>
              </div>
              <div className="p-4 rounded-xl bg-lavender-soft/50 border border-paper-line2 space-y-3">
                <p className="text-sm text-ink/75">
                  O Nexa AI tenta uma cadeia de provedores em ordem — se um estiver
                  indisponível ou sem cota, cai pro próximo automaticamente:
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {['Gemini', 'Groq', 'Mistral'].map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-lavender text-lavender-ink font-medium">{p}</span>
                      {i < arr.length - 1 && <span className="text-ink/35">→</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-ink/55">
                  A ordem e as chaves de cada provedor ficam em <code className="text-ink/70 bg-paper-sunken px-1 rounded">server/.env</code>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-sage-soft border border-sage-deep/25">
                <p className="text-sm text-ink/75">
                  ✓ Correção automática de sintaxe ativa — se um arquivo gerado não
                  compilar, o sistema tenta corrigir antes de te entregar.
                </p>
              </div>
            </div>
          )}

          {tab === 'github' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-display text-lg font-semibold text-ink">Integração com GitHub</h2>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-lavender-soft text-lavender-ink">em breve</span>
                </div>
                <p className="text-sm text-ink/55">Planejado, ainda não disponível</p>
              </div>
              <div className="p-4 rounded-xl bg-paper-sunken border border-paper-line2 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-paper-card flex items-center justify-center flex-shrink-0">
                  <Github className="w-5 h-5 text-ink/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Enviar um projeto direto pro seu repositório</p>
                  <p className="text-xs text-ink/55 mt-0.5">
                    Ainda não dá pra conectar uma conta — essa integração está em desenvolvimento.
                    Por ora, use o botão de baixar <span className="font-medium">.zip</span> no Preview.
                  </p>
                </div>
              </div>
              <button
                disabled
                className="btn-outline text-xs px-3 py-1.5 opacity-40 cursor-not-allowed"
              >
                Conectar conta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
