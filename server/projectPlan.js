// -----------------------------------------------------------------------------
// NEXA Engine 2.0 — Etapa 1: ProjectPlan estruturado + scaffold determinístico
// -----------------------------------------------------------------------------
// Sem chamadas de modelo e sem dependências novas. Pega o texto de plano que o
// planProject() já produz (===PLAN=== ... SEÇÕES / ARQUIVOS) e o transforma num
// objeto JSON. Desse objeto deriva um baseline mínimo que SEMPRE monta no
// preview: App.tsx (compõe as seções) + theme.ts.
//
// O que a IA gerar continua tendo prioridade — o scaffold só preenche buraco,
// nunca sobrescreve arquivo não-vazio da IA.
// -----------------------------------------------------------------------------

/** Seções padrão quando o plano vem ausente ou ilegível (mesmo esqueleto que o
 *  planProject() usa como template). */
const DEFAULT_SECTIONS = ['Header', 'Hero', 'Features', 'Footer'];

/** Nomes que não podem virar "seção" (colidiriam com a espinha do app). */
const RESERVED = new Set(['App', 'Theme', 'Main', 'Index']);

const MAX_SECTIONS = 14;

/** "hero section" / "Sobre Nós" -> "HeroSection" / "SobreNos" (PascalCase ASCII). */
function toComponentName(raw) {
  const ascii = String(raw || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
  if (!ascii) return '';
  const name = ascii
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return /^[A-Za-z][A-Za-z0-9]*$/.test(name) ? name : '';
}

function uniq(arr) {
  return [...new Set(arr)];
}

/** Extrai nomes de seção do bloco "SEÇÕES" do texto de plano. */
function parseSectionsFromPlanText(planText) {
  if (!planText) return [];
  const lines = String(planText).split(/\r?\n/);
  const start = lines.findIndex(l => /^\s*SE[ÇC][ÕO]ES\b/i.test(l));
  if (start === -1) return [];

  const names = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*(IMAGENS|ARQUIVOS|===)/i.test(line)) break;
    // "- Header — links e CTA" / "* Hero: headline..." / "- **Menu** ..."
    const m = line.match(/^\s*[-*]\s+\*{0,2}([A-Za-zÀ-ÿ][\wÀ-ÿ /&-]*?)\*{0,2}\s*(?:[—:–-]|$)/);
    if (!m) continue;
    const name = toComponentName(m[1]);
    if (name && !RESERVED.has(name)) names.push(name);
  }
  return names;
}

/** Extrai basenames de "components/<Nome>.tsx" citados em qualquer lugar do plano. */
function parseComponentFilesFromPlanText(planText) {
  if (!planText) return [];
  const out = [];
  const re = /components\/([A-Z][A-Za-z0-9_]*)\.tsx/g;
  let m;
  while ((m = re.exec(String(planText)))) {
    if (!RESERVED.has(m[1])) out.push(m[1]);
  }
  return out;
}

/**
 * Monta o ProjectPlan (JSON) a partir do pedido + texto de plano + tema curado.
 * Determinístico: mesma entrada => mesma saída (fora o timestamp). Nunca lança.
 *
 * @param {{ prompt?: string, planText?: string, theme?: { id?: string, label?: string } | null }} input
 */
export function buildProjectPlan({ prompt = '', planText = '', theme = null } = {}) {
  // O bloco ARQUIVOS lista os components/*.tsx que a IA REALMENTE vai criar —
  // é o que o scaffold precisa espelhar. O bloco SEÇÕES é prosa de conteúdo e
  // costuma usar rótulos em PT ("Serviços") que não batem com os nomes de
  // arquivo em EN ("Services"), gerando seção duplicada. Então: ARQUIVOS manda;
  // SEÇÕES só entra quando ARQUIVOS veio fraco; senão, esqueleto padrão.
  const fromFiles = uniq(parseComponentFilesFromPlanText(planText)).filter(Boolean);
  const fromSections = uniq(parseSectionsFromPlanText(planText)).filter(Boolean);

  let sectionNames;
  let source;
  if (fromFiles.length >= 2) {
    sectionNames = fromFiles;
    source = 'plan-files';
  } else if (fromSections.length >= 2) {
    sectionNames = fromSections;
    source = 'plan-sections';
  } else {
    sectionNames = [...DEFAULT_SECTIONS];
    source = 'default';
  }

  // Reserva espaço pra Header + Footer no limite.
  sectionNames = uniq(sectionNames).slice(0, MAX_SECTIONS - 2);

  // Header sempre em primeiro (move se já existe, insere se não).
  const isHeader = n => /^(Header|Nav|Navbar|Topbar|Navigation)$/i.test(n);
  const headerIdx = sectionNames.findIndex(isHeader);
  if (headerIdx > 0) {
    sectionNames = [
      sectionNames[headerIdx],
      ...sectionNames.slice(0, headerIdx),
      ...sectionNames.slice(headerIdx + 1),
    ];
  } else if (headerIdx === -1) {
    sectionNames.unshift('Header');
  }

  // Footer sempre por último (move se já existe, adiciona se não).
  const footerIdx = sectionNames.findIndex(n => /^Footer$/i.test(n));
  if (footerIdx !== -1 && footerIdx !== sectionNames.length - 1) {
    sectionNames = [
      ...sectionNames.slice(0, footerIdx),
      ...sectionNames.slice(footerIdx + 1),
      sectionNames[footerIdx],
    ];
  } else if (footerIdx === -1) {
    sectionNames.push('Footer');
  }

  const sections = sectionNames.map(name => ({
    id: name.toLowerCase(),
    name,
    component: name,
    file: `components/${name}.tsx`,
    purpose: `Seção "${name}" da página inicial.`,
  }));

  const page = { id: 'home', name: 'Home', route: '/', sections };

  const files = [
    { path: 'App.tsx', role: 'entry' },
    { path: 'theme.ts', role: 'theme' },
    ...sections.map(s => ({ path: s.file, role: 'section', section: s.id })),
  ];

  return {
    version: 1,
    meta: {
      prompt: String(prompt).slice(0, 500),
      themeId: theme?.id ?? null,
      source,
      generatedAt: new Date().toISOString(),
    },
    pages: [page],
    files,
  };
}

// -----------------------------------------------------------------------------
// Scaffold determinístico
// -----------------------------------------------------------------------------

function scaffoldAppTsx(plan) {
  const sections = plan?.pages?.[0]?.sections ?? [];

  if (sections.length === 0) {
    return `export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body antialiased" />
  );
}
`;
  }

  const imports = sections
    .map(s => `import ${s.component} from './${s.file.replace(/\.tsx$/, '')}';`)
    .join('\n');
  const body = sections.map(s => `      <${s.component} />`).join('\n');

  return `${imports}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body antialiased">
${body}
    </div>
  );
}
`;
}

function scaffoldThemeTs(theme) {
  const rawAccent =
    theme?.palette?.primary && typeof theme.palette.primary === 'object'
      ? theme.palette.primary.DEFAULT
      : theme?.palette?.primary;
  const accent = typeof rawAccent === 'string' && rawAccent ? rawAccent : '#6d28d9';
  const name = theme?.label || 'Nexa';

  return `export const theme = {
  name: ${JSON.stringify(name)},
  tagline: '',
  accent: ${JSON.stringify(accent)},
} as const;
`;
}

/** Stub válido e neutro de uma seção — monta no preview sem renderizar nada
 *  visível e sem quebrar o bundle. */
export function sectionStub(name) {
  const safe = toComponentName(name) || 'Section';
  return `export default function ${safe}() {
  return <section id="${safe.toLowerCase()}" className="mx-auto max-w-6xl px-6 py-24" />;
}
`;
}

/**
 * Espinha determinística do plano: só App.tsx + theme.ts (os arquivos cuja
 * ausência quebra o preview inteiro). Retorna [{ name, content }] no mesmo
 * formato dos arquivos da IA.
 */
export function scaffoldSpine(plan, theme = null) {
  return [
    { name: 'App.tsx', content: scaffoldAppTsx(plan) },
    { name: 'theme.ts', content: scaffoldThemeTs(theme) },
  ];
}

/**
 * Une os arquivos da IA com o scaffold. Regra única: o arquivo da IA vence
 * sempre que existir e tiver conteúdo não-vazio; o scaffold só entra onde
 * falta. Nunca remove nada que a IA gerou. Preserva a ordem (IA primeiro).
 */
export function mergeScaffold(aiFiles, scaffoldFiles) {
  const byName = new Map();
  for (const f of aiFiles || []) byName.set(f.name, f);
  for (const s of scaffoldFiles || []) {
    const existing = byName.get(s.name);
    if (!existing || !String(existing.content || '').trim()) {
      byName.set(s.name, { ...s });
    }
  }
  return [...byName.values()];
}
