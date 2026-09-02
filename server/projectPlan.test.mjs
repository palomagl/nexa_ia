// Testes offline do ProjectPlan + scaffold determinístico (Engine 2.0 — etapa 1).
//   node projectPlan.test.mjs   (ou: npm test, na pasta server/)
import assert from 'node:assert';
import * as Babel from '@babel/standalone';
import { buildProjectPlan, scaffoldSpine, mergeScaffold, sectionStub } from './projectPlan.js';

function parses(name, content) {
  Babel.transform(content, {
    presets: [['react', { runtime: 'automatic' }], 'typescript'],
    filename: name.endsWith('.ts') ? 'x.ts' : 'x.tsx',
  });
}

const planText = `===PLAN===
NEGÓCIO: Aurora, café de especialidade.

SEÇÕES (ordem de cima pra baixo):
- Header — links e CTA
- Hero — headline + subtexto
- **Menu** — 6 cafés reais
- Sobre Nós — história
- Footer — colunas

IMAGENS: Hero: cozy coffee bar

ARQUIVOS:
- App.tsx — composição
- theme.ts — objeto theme
- components/Header.tsx — Header
- components/Hero.tsx — Hero
- components/Menu.tsx — Menu
- components/SobreNos.tsx — sobre nós
- components/Depoimentos.tsx — depoimentos
===END===`;

const theme = {
  id: 'cafe-artesanal',
  label: 'Café Artesanal',
  palette: { primary: { DEFAULT: '#a8551f', foreground: '#fff' } },
};
const plan = buildProjectPlan({ prompt: 'crie um site pra cafeteria Aurora', planText, theme });

assert.equal(plan.version, 1);
assert.equal(plan.meta.source, 'plan-files');
assert.equal(plan.meta.themeId, 'cafe-artesanal');
assert.equal(plan.pages.length, 1);
const comps = plan.pages[0].sections.map(s => s.component);
assert.deepEqual(comps, ['Header', 'Hero', 'Menu', 'SobreNos', 'Depoimentos', 'Footer'], 'seções: ' + comps.join(','));
assert.ok(plan.files.some(f => f.path === 'App.tsx' && f.role === 'entry'));
assert.ok(plan.files.some(f => f.path === 'theme.ts' && f.role === 'theme'));
assert.ok(plan.files.some(f => f.path === 'components/Menu.tsx' && f.role === 'section'));

const plan2 = buildProjectPlan({ prompt: 'crie um site pra cafeteria Aurora', planText, theme });
assert.deepEqual(
  { ...plan, meta: { ...plan.meta, generatedAt: 0 } },
  { ...plan2, meta: { ...plan2.meta, generatedAt: 0 } },
  'buildProjectPlan não é determinístico',
);

const bare = buildProjectPlan({ prompt: 'algo', planText: '', theme: null });
assert.equal(bare.meta.source, 'default');
assert.deepEqual(bare.pages[0].sections.map(s => s.component), ['Header', 'Hero', 'Features', 'Footer']);
assert.equal(bare.meta.themeId, null);

// mistura PT (SEÇÕES) + EN (ARQUIVOS) -> ARQUIVOS manda, sem duplicar
const mixed = buildProjectPlan({
  prompt: 'barbearia',
  planText: `SEÇÕES:
- Header — links
- Hero — headline
- Serviços — cortes
- Contato — endereço
- Footer

ARQUIVOS:
- App.tsx
- components/Header.tsx
- components/Hero.tsx
- components/Services.tsx
- components/Contact.tsx
- components/Footer.tsx`,
});
assert.equal(mixed.meta.source, 'plan-files');
assert.deepEqual(
  mixed.pages[0].sections.map(s => s.component),
  ['Header', 'Hero', 'Services', 'Contact', 'Footer'],
  'PT/EN não deduplicou: ' + mixed.pages[0].sections.map(s => s.component).join(','),
);

// só SEÇÕES (ARQUIVOS fraco) -> usa SEÇÕES
const onlySections = buildProjectPlan({
  prompt: 'x',
  planText: `SEÇÕES:
- Header
- Hero
- Precos
- Faq
- Footer

ARQUIVOS:
- App.tsx`,
});
assert.equal(onlySections.meta.source, 'plan-sections');
assert.deepEqual(onlySections.pages[0].sections.map(s => s.component), ['Header', 'Hero', 'Precos', 'Faq', 'Footer']);

// scaffoldSpine: App.tsx + theme.ts, ambos compilam
const spine = scaffoldSpine(plan, theme);
assert.deepEqual(spine.map(f => f.name), ['App.tsx', 'theme.ts']);
for (const f of spine) parses(f.name, f.content);
assert.ok(spine[0].content.includes("import Menu from './components/Menu'"));
assert.ok(spine[0].content.includes('<SobreNos />'));
assert.ok(spine[1].content.includes('#a8551f'));

parses('theme.ts', scaffoldSpine(bare, null)[1].content);
assert.ok(scaffoldSpine(bare, null)[1].content.includes('#6d28d9'));

parses('components/Depoimentos.tsx', sectionStub('Depoimentos'));
assert.ok(sectionStub('Depoimentos').includes('export default function Depoimentos()'));

// mergeScaffold: IA vence quando não-vazio; scaffold preenche buraco
const ai = [
  { name: 'App.tsx', content: 'export default function App(){return <div>real</div>}' },
  { name: 'components/Extra.tsx', content: 'export default () => null' },
];
const merged = mergeScaffold(ai, spine);
assert.equal(merged.find(f => f.name === 'App.tsx').content, ai[0].content, 'App.tsx da IA deveria vencer');
assert.ok(merged.find(f => f.name === 'theme.ts'), 'theme.ts do scaffold deveria entrar');
assert.ok(merged.find(f => f.name === 'components/Extra.tsx'), 'arquivo extra da IA preservado');
assert.equal(merged.length, ai.length + 1, 'só theme.ts foi adicionado');

// IA não mandou App.tsx nem theme.ts -> os dois vêm do scaffold e compilam
const aiNoSpine = [{ name: 'components/Hero.tsx', content: 'export default () => <section/>' }];
const m2 = mergeScaffold(aiNoSpine, spine);
const m2App = m2.find(f => f.name === 'App.tsx');
const m2Theme = m2.find(f => f.name === 'theme.ts');
assert.ok(m2App && m2App.content.includes('export default function App'), 'App.tsx do scaffold deveria entrar');
assert.ok(m2Theme && m2Theme.content.includes('export const theme'), 'theme.ts do scaffold deveria entrar');
parses('App.tsx', m2App.content);
parses('theme.ts', m2Theme.content);

// IA mandou App.tsx VAZIO -> scaffold substitui
const aiEmptyApp = [{ name: 'App.tsx', content: '   \n  ' }];
const m3 = mergeScaffold(aiEmptyApp, spine);
assert.ok(
  m3.find(f => f.name === 'App.tsx').content.includes('export default function App'),
  'App.tsx vazio deveria ser trocado pelo scaffold',
);

console.log('projectPlan — Etapa 1: todos os asserts OK');
