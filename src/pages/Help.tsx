import { useState } from 'react';
import { Sparkles, MessageSquare, Eye, History, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Star } from '../components/ui/Doodles';

const stepTints = ['bg-lavender text-lavender-ink', 'bg-sage text-sage-ink', 'bg-rose text-rose-ink', 'bg-lavender-deep text-white'];

const steps = [
  {
    icon: Sparkles,
    title: '1. Descreva o que quer criar',
    desc: 'Na tela inicial, escreva em texto (ou dite por voz, no ícone do microfone) o que você quer construir — ex.: "landing page para uma cafeteria, com cardápio e formulário de contato". Quanto mais específico, melhor o resultado.',
  },
  {
    icon: Eye,
    title: '2. Veja o resultado ao vivo',
    desc: 'A IA gera o código e você já vê funcionando no Preview, dentro do workspace do projeto. Dá pra alternar entre Preview e Código, e testar em tamanhos de tela diferentes (desktop, tablet, celular).',
  },
  {
    icon: MessageSquare,
    title: '3. Peça ajustes pelo chat',
    desc: 'No painel de chat do projeto, descreva o que quer mudar ("deixe o botão azul", "adicione uma seção de depoimentos"). A IA edita só o que precisa, sem refazer o projeto do zero. Dá pra anexar uma imagem (ícone do clipe) se quiser usá-la no site.',
  },
  {
    icon: History,
    title: '4. Histórico de versões',
    desc: 'Toda alteração vira um checkpoint no painel de Histórico. Se algo não ficou bom, dá pra restaurar uma versão anterior a qualquer momento.',
  },
];

const faqs = [
  {
    q: 'Por que às vezes uma imagem não aparece exatamente do jeito que eu esperava?',
    a: 'As imagens são escolhidas por busca a partir de uma descrição em inglês feita pela IA. Se o resultado não combinar bem, peça no chat pra "trocar a imagem de [seção] por outra de [descrição]".',
  },
  {
    q: 'Um botão ou link parou de funcionar / a página ficou com aparência estranha depois de um clique',
    a: 'Isso normalmente é um erro de geração da IA. Conte o que aconteceu no chat do projeto (ex.: "o botão X não faz nada" ou "a página reiniciou quando cliquei em Y") e peça pra corrigir — a IA tem acesso ao código atual e ajusta só o necessário.',
  },
  {
    q: 'Apareceu "Erro ao executar o projeto" no Preview',
    a: 'O sistema já tenta detectar e corrigir automaticamente erros de código antes de entregar. Se ainda assim aparecer, peça no chat "corrija o erro de sintaxe" — geralmente resolve. Se persistir, tente pedir a alteração de um jeito diferente.',
  },
  {
    q: 'Por que a IA demora mais às vezes?',
    a: 'O Nexa AI tenta vários provedores de IA em sequência — se o principal estiver sobrecarregado, ele tenta o próximo automaticamente, sem você precisar fazer nada. Isso pode levar alguns segundos a mais em horários de pico.',
  },
];

export function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-semibold text-ink doodle-underline">Como o Nexa AI funciona</h1>
          <Star size={16} fill className="text-lavender-deep/70 mb-1" rotate={-8} />
        </div>
        <p className="hand text-xl text-ink/55 mt-1">
          você descreve, a IA cria e mostra funcionando — e você refina conversando
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {steps.map((s, i) => (
          <div key={s.title} className="paper-card p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stepTints[i % stepTints.length])}>
              <s.icon className="w-4 h-4" />
            </div>
            <h3 className="font-display font-medium text-ink mb-1.5">{s.title}</h3>
            <p className="text-sm text-ink/60 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold text-ink mb-4">Perguntas frequentes</h2>
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <div key={f.q} className="paper-card overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-sm font-medium text-ink">{f.q}</span>
              <ChevronDown className={cn('w-4 h-4 text-ink/55 flex-shrink-0 transition-transform', openFaq === i && 'rotate-180')} />
            </button>
            {openFaq === i && (
              <div className="px-4 pb-4 text-sm text-ink/60 leading-relaxed">{f.a}</div>
            )}
          </div>
        ))}
      </div>

      <div className="washi mt-10 rounded-2xl border border-sage-deep/30 bg-sage-soft shadow-paper p-5 flex items-center gap-3">
        <ImageIcon className="w-5 h-5 text-sage-ink flex-shrink-0" />
        <p className="text-sm text-ink/75">
          Dica: quer usar uma foto ou logo sua no site? Anexe pelo ícone do clipe no chat do projeto e peça
          pra IA usá-la (ex.: "usa essa imagem como logo no cabeçalho").
        </p>
      </div>
    </div>
  );
}
