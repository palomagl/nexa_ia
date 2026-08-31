/*
|--------------------------------------------------------------------------
| BIBLIOTECA DE TEMAS CURADOS
|--------------------------------------------------------------------------
|
| Mesma ideia da identidade do próprio Nexa: em vez de o modelo inventar
| paleta + tipografia + espaçamento do zero a cada geração (resultado
| inconsistente, às vezes feio), o passo de planejamento ESCOLHE um tema
| pronto pelo tipo de negócio e passa os valores exatos pro builder.
|
| Cada tema define os mesmos tokens semânticos que o front usa no Tailwind
| (background/foreground/primary/muted/border/...), então o preview e o
| .zip aplicam a paleta de verdade — não fica só no theme.ts.
|
| `keywords` são batidas (sem acento, minúsculas) contra o pedido + o
| texto do plano pra escolher o tema. Sem chamada de modelo extra.
*/

/** @typedef {{ background:string, foreground:string, card:{DEFAULT:string,foreground:string}, popover:{DEFAULT:string,foreground:string}, primary:{DEFAULT:string,foreground:string}, secondary:{DEFAULT:string,foreground:string}, muted:{DEFAULT:string,foreground:string}, accent:{DEFAULT:string,foreground:string}, destructive:{DEFAULT:string,foreground:string}, border:string, input:string, ring:string }} Palette */

export const THEME_LIBRARY = [
  {
    id: 'saas-modern',
    label: 'SaaS / tecnologia',
    keywords: ['saas', 'software', 'startup', 'tecnologia', 'dashboard', 'api', 'b2b', 'crm', 'analytics', 'automacao', 'integracao', 'no-code', 'devtool'],
    fonts: { display: 'Space Grotesk', body: 'Inter' },
    radius: '0.5rem',
    personality: 'minimalista, preciso, muito espaço em branco, sombras sutis, acento vibrante único',
    palette: {
      background: '#ffffff', foreground: '#0b0f19',
      card: { DEFAULT: '#ffffff', foreground: '#0b0f19' },
      popover: { DEFAULT: '#ffffff', foreground: '#0b0f19' },
      primary: { DEFAULT: '#4f46e5', foreground: '#ffffff' },
      secondary: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
      muted: { DEFAULT: '#f8fafc', foreground: '#64748b' },
      accent: { DEFAULT: '#eef2ff', foreground: '#3730a3' },
      destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
      border: '#e2e8f0', input: '#e2e8f0', ring: '#6366f1',
    },
  },
  {
    id: 'cafe-artesanal',
    label: 'Cafeteria / padaria / gastronomia artesanal',
    keywords: ['cafe', 'cafeteria', 'padaria', 'confeitaria', 'restaurante', 'bistro', 'brunch', 'gastronomia', 'comida', 'doceria', 'artesanal', 'bakery', 'food', 'cozinha'],
    fonts: { display: 'Fraunces', body: 'Nunito Sans' },
    radius: '0.75rem',
    personality: 'quente, aconchegante, orgânico, texturas de papel, tons terrosos, sem excesso de sombra',
    palette: {
      background: '#fdf9f3', foreground: '#2b211a',
      card: { DEFAULT: '#ffffff', foreground: '#2b211a' },
      popover: { DEFAULT: '#ffffff', foreground: '#2b211a' },
      primary: { DEFAULT: '#a8551f', foreground: '#fdf9f3' },
      secondary: { DEFAULT: '#f2e7d8', foreground: '#4a3928' },
      muted: { DEFAULT: '#f2e7d8', foreground: '#8a7358' },
      accent: { DEFAULT: '#e8ddc7', foreground: '#5b4526' },
      destructive: { DEFAULT: '#b3261e', foreground: '#ffffff' },
      border: '#e6d9c4', input: '#e6d9c4', ring: '#a8551f',
    },
  },
  {
    id: 'moda-editorial',
    label: 'Moda / loja de roupas / lifestyle',
    keywords: ['moda', 'roupa', 'roupas', 'loja', 'boutique', 'fashion', 'vestuario', 'acessorios', 'joias', 'joalheria', 'lifestyle', 'editorial', 'ecommerce de roupa', 'streetwear', 'calcados'],
    fonts: { display: 'Bodoni Moda', body: 'Inter' },
    radius: '0rem',
    personality: 'editorial, alto contraste, tipografia grande, muito espaço negativo, sem cantos arredondados, fotográfico',
    palette: {
      background: '#ffffff', foreground: '#111111',
      card: { DEFAULT: '#ffffff', foreground: '#111111' },
      popover: { DEFAULT: '#ffffff', foreground: '#111111' },
      primary: { DEFAULT: '#111111', foreground: '#ffffff' },
      secondary: { DEFAULT: '#f4f4f4', foreground: '#111111' },
      muted: { DEFAULT: '#f4f4f4', foreground: '#6b6b6b' },
      accent: { DEFAULT: '#eae7df', foreground: '#111111' },
      destructive: { DEFAULT: '#c0392b', foreground: '#ffffff' },
      border: '#e5e5e5', input: '#d4d4d4', ring: '#111111',
    },
  },
  {
    id: 'saude-bem-estar',
    label: 'Saúde / nutrição / bem-estar / clínica',
    keywords: ['saude', 'nutricao', 'nutricionista', 'clinica', 'medico', 'medica', 'consultorio', 'psicologo', 'psicologa', 'terapia', 'bem estar', 'wellness', 'yoga', 'fisioterapia', 'dentista', 'odontologia', 'spa'],
    fonts: { display: 'Poppins', body: 'Inter' },
    radius: '1rem',
    personality: 'calmo, limpo, acolhedor, verdes suaves, cantos generosos, respiro',
    palette: {
      background: '#f7faf8', foreground: '#14261d',
      card: { DEFAULT: '#ffffff', foreground: '#14261d' },
      popover: { DEFAULT: '#ffffff', foreground: '#14261d' },
      primary: { DEFAULT: '#2f855a', foreground: '#ffffff' },
      secondary: { DEFAULT: '#e6f2ec', foreground: '#1f4733' },
      muted: { DEFAULT: '#eaf3ee', foreground: '#5c7a6b' },
      accent: { DEFAULT: '#d7ebe0', foreground: '#1f4733' },
      destructive: { DEFAULT: '#c53030', foreground: '#ffffff' },
      border: '#d9e8e0', input: '#d9e8e0', ring: '#2f855a',
    },
  },
  {
    id: 'financas-corporativo',
    label: 'Finanças / jurídico / consultoria / corporativo',
    keywords: ['financas', 'financeiro', 'banco', 'investimento', 'contabilidade', 'contador', 'advogado', 'advocacia', 'juridico', 'consultoria', 'corporativo', 'seguros', 'imobiliaria', 'imoveis', 'empresa'],
    fonts: { display: 'Libre Franklin', body: 'Inter' },
    radius: '0.375rem',
    personality: 'sério, confiável, denso mas organizado, azul-marinho, detalhes discretos',
    palette: {
      background: '#ffffff', foreground: '#0f1b2d',
      card: { DEFAULT: '#ffffff', foreground: '#0f1b2d' },
      popover: { DEFAULT: '#ffffff', foreground: '#0f1b2d' },
      primary: { DEFAULT: '#1e3a5f', foreground: '#ffffff' },
      secondary: { DEFAULT: '#eef2f6', foreground: '#1e3a5f' },
      muted: { DEFAULT: '#f4f6f8', foreground: '#5a6b7f' },
      accent: { DEFAULT: '#e3ecf5', foreground: '#1e3a5f' },
      destructive: { DEFAULT: '#b91c1c', foreground: '#ffffff' },
      border: '#dde3ea', input: '#dde3ea', ring: '#1e3a5f',
    },
  },
  {
    id: 'criativo-agencia',
    label: 'Agência criativa / portfólio / estúdio de design',
    keywords: ['agencia', 'portfolio', 'estudio', 'design', 'criativo', 'branding', 'publicidade', 'marketing', 'fotografo', 'fotografia', 'ilustrador', 'artista', 'produtora', 'audiovisual', 'freelancer'],
    fonts: { display: 'Clash Display', body: 'Satoshi' },
    radius: '1.25rem',
    personality: 'ousado, expressivo, cores saturadas, tipografia enorme, formas grandes, playful mas sofisticado',
    palette: {
      background: '#0f0f12', foreground: '#f4f4f5',
      card: { DEFAULT: '#1a1a1f', foreground: '#f4f4f5' },
      popover: { DEFAULT: '#1a1a1f', foreground: '#f4f4f5' },
      primary: { DEFAULT: '#c4f042', foreground: '#0f0f12' },
      secondary: { DEFAULT: '#26262d', foreground: '#f4f4f5' },
      muted: { DEFAULT: '#26262d', foreground: '#a1a1aa' },
      accent: { DEFAULT: '#2d2438', foreground: '#e9d5ff' },
      destructive: { DEFAULT: '#f43f5e', foreground: '#ffffff' },
      border: '#2e2e37', input: '#2e2e37', ring: '#c4f042',
    },
  },
  {
    id: 'educacao',
    label: 'Educação / curso / escola / plataforma de ensino',
    keywords: ['educacao', 'curso', 'cursos', 'escola', 'faculdade', 'ensino', 'aula', 'aulas', 'professor', 'aluno', 'estudante', 'e-learning', 'treinamento', 'mentoria', 'workshop', 'infoproduto'],
    fonts: { display: 'Sora', body: 'Inter' },
    radius: '0.75rem',
    personality: 'amigável, claro, confiante, azul + laranja de apoio, ilustrativo, hierarquia forte',
    palette: {
      background: '#ffffff', foreground: '#111827',
      card: { DEFAULT: '#ffffff', foreground: '#111827' },
      popover: { DEFAULT: '#ffffff', foreground: '#111827' },
      primary: { DEFAULT: '#2563eb', foreground: '#ffffff' },
      secondary: { DEFAULT: '#eff6ff', foreground: '#1d4ed8' },
      muted: { DEFAULT: '#f3f4f6', foreground: '#6b7280' },
      accent: { DEFAULT: '#fff1e6', foreground: '#c2410c' },
      destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
      border: '#e5e7eb', input: '#e5e7eb', ring: '#2563eb',
    },
  },
  {
    id: 'evento-comunidade',
    label: 'Evento / conferência / comunidade / ONG',
    keywords: ['evento', 'eventos', 'conferencia', 'festival', 'meetup', 'comunidade', 'ong', 'social', 'doacao', 'voluntario', 'campanha', 'igreja', 'associacao', 'movimento', 'causa'],
    fonts: { display: 'Archivo', body: 'Inter' },
    radius: '0.5rem',
    personality: 'energético, direto, urgência positiva, roxo + coral, blocos grandes, CTA forte',
    palette: {
      background: '#faf9fc', foreground: '#1c1425',
      card: { DEFAULT: '#ffffff', foreground: '#1c1425' },
      popover: { DEFAULT: '#ffffff', foreground: '#1c1425' },
      primary: { DEFAULT: '#7c3aed', foreground: '#ffffff' },
      secondary: { DEFAULT: '#f3ecfd', foreground: '#5b21b6' },
      muted: { DEFAULT: '#f2eef8', foreground: '#6b5b84' },
      accent: { DEFAULT: '#ffe4e0', foreground: '#c2410c' },
      destructive: { DEFAULT: '#e11d48', foreground: '#ffffff' },
      border: '#e7e0f2', input: '#e7e0f2', ring: '#7c3aed',
    },
  },
  {
    id: 'ecommerce-geral',
    label: 'E-commerce geral / marketplace / varejo',
    keywords: ['ecommerce', 'e-commerce', 'loja online', 'marketplace', 'varejo', 'produtos', 'catalogo', 'carrinho', 'checkout', 'vendas', 'dropshipping', 'assinatura de produtos'],
    fonts: { display: 'Manrope', body: 'Inter' },
    radius: '0.625rem',
    personality: 'limpo, confiável, foco no produto, neutro com um acento quente, grids densos, badges de promoção',
    palette: {
      background: '#ffffff', foreground: '#18181b',
      card: { DEFAULT: '#ffffff', foreground: '#18181b' },
      popover: { DEFAULT: '#ffffff', foreground: '#18181b' },
      primary: { DEFAULT: '#ea580c', foreground: '#ffffff' },
      secondary: { DEFAULT: '#f4f4f5', foreground: '#27272a' },
      muted: { DEFAULT: '#fafafa', foreground: '#71717a' },
      accent: { DEFAULT: '#fef3c7', foreground: '#92400e' },
      destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
      border: '#e4e4e7', input: '#e4e4e7', ring: '#ea580c',
    },
  },
  {
    id: 'fitness-esporte',
    label: 'Academia / fitness / esporte / personal',
    keywords: ['academia', 'fitness', 'personal', 'treino', 'musculacao', 'crossfit', 'esporte', 'gym', 'nutri esportiva', 'corrida', 'ciclismo', 'luta', 'pilates funcional', 'box'],
    fonts: { display: 'Barlow Condensed', body: 'Inter' },
    radius: '0.25rem',
    personality: 'intenso, alto contraste, preto + amarelo/verde-limão, diagonais, tipografia condensada em caixa alta',
    palette: {
      background: '#0a0a0a', foreground: '#fafafa',
      card: { DEFAULT: '#161616', foreground: '#fafafa' },
      popover: { DEFAULT: '#161616', foreground: '#fafafa' },
      primary: { DEFAULT: '#d4ff00', foreground: '#0a0a0a' },
      secondary: { DEFAULT: '#1f1f1f', foreground: '#fafafa' },
      muted: { DEFAULT: '#1f1f1f', foreground: '#a3a3a3' },
      accent: { DEFAULT: '#26260a', foreground: '#d4ff00' },
      destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
      border: '#2a2a2a', input: '#2a2a2a', ring: '#d4ff00',
    },
  },
];

/** Tema usado quando nada bate com o pedido. */
export const DEFAULT_THEME_ID = 'saas-modern';

function deburr(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Escolhe um tema pelo pedido do usuário (+ texto do plano, se houver).
 * Pontua cada tema pelo número de keywords que aparecem no texto; desempate
 * pela ordem da biblioteca. Sem match => tema padrão.
 */
export function resolveTheme(prompt, planText = '') {
  const haystack = deburr(`${prompt} ${planText}`);
  let best = null;
  let bestScore = 0;

  for (const theme of THEME_LIBRARY) {
    let score = 0;
    for (const kw of theme.keywords) {
      const k = deburr(kw);
      // keyword com espaço: substring; keyword de uma palavra: limite de
      // palavra, senão 'ia' casa dentro de 'papelaria'/'advocacia'.
      const hit = k.includes(' ')
        ? haystack.includes(k)
        : new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}\\b`).test(haystack);
      if (hit) score += 1;
    }
    if (score > bestScore) {
      best = theme;
      bestScore = score;
    }
  }

  const chosen = best || THEME_LIBRARY.find(t => t.id === DEFAULT_THEME_ID);
  return { theme: chosen, score: bestScore, matched: bestScore > 0 };
}

/** Bloco de texto injetado no plano — o builder deve usar EXATAMENTE estes
 *  valores no theme.ts e nas classes/estilos. */
export function renderThemeBlock(theme) {
  const p = theme.palette;
  return `
======================================================================
TEMA CURADO: ${theme.label}  (id: ${theme.id})
USE EXATAMENTE ESTES VALORES — não invente outra paleta/tipografia.
======================================================================

Tipografia (Google Fonts — carregue via <link> no App ou @import no topo
de um componente; caia para sans-serif do sistema se preferir):
- Títulos (display): ${theme.fonts.display}
- Corpo: ${theme.fonts.body}

Raio de borda base: ${theme.radius}
Personalidade: ${theme.personality}

Paleta (os tokens do Tailwind já estão configurados com estes valores —
use as classes bg-primary, text-primary-foreground, bg-muted,
text-muted-foreground, border-border, bg-card, bg-background,
text-foreground, bg-secondary, bg-accent, bg-destructive):
- background ${p.background} / foreground ${p.foreground}
- primary ${p.primary.DEFAULT} / primary-foreground ${p.primary.foreground}
- secondary ${p.secondary.DEFAULT} / secondary-foreground ${p.secondary.foreground}
- muted ${p.muted.DEFAULT} / muted-foreground ${p.muted.foreground}
- accent ${p.accent.DEFAULT} / accent-foreground ${p.accent.foreground}
- card ${p.card.DEFAULT} / border ${p.border} / ring ${p.ring}

No theme.ts, exporte estes mesmos valores + as fontes e o raio, para os
toques de identidade fora do sistema de tokens.
`;
}
