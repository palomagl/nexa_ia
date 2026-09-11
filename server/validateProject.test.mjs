// Testes offline da Validation V1 — sem rede, sem modelo, sem framework.
//   node validateProject.test.mjs   (ou: npm test, na pasta server/)
import assert from 'node:assert';
import * as Babel from '@babel/standalone';
import { UI_KIT_FILES } from './uiKit.js';
import { analyzeProject, autoImport, enforceModuleIntegrity } from './validateProject.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

function compiles(name, code) {
  Babel.transform(code, {
    presets: [['react', { runtime: 'automatic' }], 'typescript'],
    filename: /\.ts$/.test(name) ? 'x.ts' : 'x.tsx',
  });
}

const GOOD_APP = {
  name: 'App.tsx',
  content: `import Header from './components/Header';
export default function App() {
  return <div><Header /></div>;
}
`,
};
const GOOD_HEADER = {
  name: 'components/Header.tsx',
  content: `import { Button } from './ui/button';
export default function Header() {
  return <header><Button>Entrar</Button></header>;
}
`,
};

console.log('validateProject — Validation V1');

// ---------------------------------------------------------------------------
// BUG 2 — componente/identificador usado sem import
// ---------------------------------------------------------------------------
const BROKEN_IMPORTS = {
  name: 'components/Testimonials.tsx',
  content: `export default function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => { setI(1); }, []);
  return (
    <div className="relative mt-12 flex items-center justify-center">
      <Button variant="ghost" size="icon" onClick={() => setI(i - 1)}>
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Card><CardContent>Depoimento {i}</CardContent></Card>
      <Button variant="ghost" size="icon" onClick={() => setI(i + 1)}>
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
}
`,
};

test('bug2: analyzeProject acusa os identificadores sem import', () => {
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, BROKEN_IMPORTS, ...UI_KIT_FILES]);
  const names = r.undefinedRefs.filter(u => u.file === 'components/Testimonials.tsx').map(u => u.name).sort();
  assert.deepEqual(names, ['Button', 'Card', 'CardContent', 'ChevronLeft', 'ChevronRight', 'useEffect', 'useState']);
});

test('bug2: autoImport resolve kit + react + lucide de forma determinística', () => {
  const res = autoImport(BROKEN_IMPORTS, ['Button', 'Card', 'CardContent', 'ChevronLeft', 'ChevronRight', 'useEffect', 'useState']);
  assert.equal(res.changed, true);
  assert.deepEqual(res.unresolved, []);
  const reactLine = res.content.split('\n').find(l => /from 'react'/.test(l)) || '';
  assert.ok(/\buseState\b/.test(reactLine) && /\buseEffect\b/.test(reactLine), `react import: ${reactLine}`);
  assert.match(res.content, /import \{ Button \} from '\.\/ui\/button'/);
  assert.match(res.content, /import \{ Card, CardContent \} from '\.\/ui\/card'/);
  assert.match(res.content, /import \{ ChevronLeft, ChevronRight \} from 'lucide-react'/);
  compiles('components/Testimonials.tsx', res.content);
});

test('bug2: enforceModuleIntegrity conserta sem estubar e sem chamar IA', () => {
  const { files, fixed, broken, stubbed } = enforceModuleIntegrity(
    [GOOD_APP, GOOD_HEADER, BROKEN_IMPORTS, ...UI_KIT_FILES],
  );
  assert.ok(fixed.includes('components/Testimonials.tsx'), 'deveria estar em fixed');
  assert.equal(broken.length, 0);
  assert.equal(stubbed.length, 0);
  const t = files.find(f => f.name === 'components/Testimonials.tsx');
  compiles(t.name, t.content);
  // re-análise limpa
  const r = analyzeProject(files);
  assert.equal(r.undefinedRefs.length, 0, JSON.stringify(r.undefinedRefs));
});

test('bug2: merge num import de lucide já existente (esqueceu 1 ícone)', () => {
  const f = {
    name: 'components/Hero.tsx',
    content: `import { ArrowRight } from 'lucide-react';
export default function Hero() { return <div><ArrowRight/><Rocket/></div>; }
`,
  };
  const res = autoImport(f, ['Rocket']);
  assert.match(res.content, /import \{ ArrowRight, Rocket \} from 'lucide-react'/);
  assert.deepEqual(res.unresolved, []);
  compiles(f.name, res.content);
});

// ---------------------------------------------------------------------------
// BUG 1 — TSX com erro de sintaxe
// ---------------------------------------------------------------------------
const SYNTAX_BROKEN = {
  name: 'components/FeaturedProducts.tsx',
  content: `import { useState } from 'react';
export default function FeaturedProducts() {
  const [items] = useState([
    { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max',', price: 9 },
  ]);
  return <div>{items.length}</div>;
}
`,
};

test('bug1: analyzeProject reporta parseError (não trava)', () => {
  const r = analyzeProject([GOOD_APP, SYNTAX_BROKEN, ...UI_KIT_FILES]);
  assert.equal(r.parseErrors.length, 1);
  assert.equal(r.parseErrors[0].file, 'components/FeaturedProducts.tsx');
});

test('bug1: portão troca seção com sintaxe quebrada por stub válido', () => {
  const { files, stubbed, broken } = enforceModuleIntegrity(
    [GOOD_APP, GOOD_HEADER, SYNTAX_BROKEN, ...UI_KIT_FILES],
    ['components/FeaturedProducts.tsx'], // veio quebrado da validação de sintaxe
  );
  assert.ok(stubbed.some(s => s.name === 'components/FeaturedProducts.tsx'), 'deveria estar em stubbed');
  assert.equal(broken.length, 0);
  const fp = files.find(f => f.name === 'components/FeaturedProducts.tsx');
  compiles(fp.name, fp.content);
  assert.match(fp.content, /export default function FeaturedProducts\(\)/);
});

test('bug1: sintaxe quebrada sem priorBroken ainda vira stub', () => {
  const { files, stubbed } = enforceModuleIntegrity([GOOD_APP, SYNTAX_BROKEN, ...UI_KIT_FILES]);
  assert.ok(stubbed.some(s => s.name === 'components/FeaturedProducts.tsx'));
  compiles('x.tsx', files.find(f => f.name === 'components/FeaturedProducts.tsx').content);
});

// ---------------------------------------------------------------------------
// Guardas contra falso positivo
// ---------------------------------------------------------------------------
test('guarda: projeto são + kit => zero achados', () => {
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, ...UI_KIT_FILES]);
  assert.deepEqual(r.undefinedRefs, []);
  assert.deepEqual(r.unresolvedImports, []);
  assert.deepEqual(r.unavailableDeps, []);
  assert.deepEqual(r.parseErrors, []);
});

test('guarda: arquivo cheio de tipos TS não gera undefinedRefs', () => {
  const typed = {
    name: 'components/Pricing.tsx',
    content: `import { useState, useMemo } from 'react';
import { Card } from './ui/card';
interface Plan { id: string; price: number; features: string[]; }
type Cycle = 'mensal' | 'anual';
export default function Pricing({ initial }: { initial?: Cycle }) {
  const [cycle, setCycle] = useState<Cycle>(initial ?? 'mensal');
  const ref = useMemo<Plan[]>(() => [], []);
  const el: HTMLDivElement | null = null;
  return <Card data-count={ref.length} onClick={() => setCycle('anual')}>{cycle}{String(el)}</Card>;
}
`,
  };
  const r = analyzeProject([GOOD_APP, typed, ...UI_KIT_FILES]);
  assert.deepEqual(r.undefinedRefs.filter(u => u.file === typed.name), [], JSON.stringify(r.undefinedRefs));
  assert.deepEqual(r.parseErrors, []);
});

test('guarda: globais do browser não são "não definidos"', () => {
  const f = {
    name: 'components/Contact.tsx',
    content: `export default function Contact() {
  const onSubmit = (e) => { e.preventDefault(); window.localStorage.setItem('x', JSON.stringify({ at: Date.now() })); fetch('/x'); };
  return <form onSubmit={onSubmit}><button type="submit">Enviar</button></form>;
}
`,
  };
  const r = analyzeProject([f, ...UI_KIT_FILES]);
  assert.deepEqual(r.undefinedRefs, [], JSON.stringify(r.undefinedRefs));
});

// ---------------------------------------------------------------------------
// Casos "hard" que NÃO são os dois bugs
// ---------------------------------------------------------------------------
test('variável realmente indefinida => seção vira stub', () => {
  const f = {
    name: 'components/Slider.tsx',
    content: `import { Button } from './ui/button';
export default function Slider() {
  return <Button onClick={goToPrevious}>anterior</Button>;
}
`,
  };
  const { stubbed, broken } = enforceModuleIntegrity([GOOD_APP, GOOD_HEADER, f, ...UI_KIT_FILES]);
  assert.ok(stubbed.some(s => s.name === 'components/Slider.tsx' && /goToPrevious/.test(s.error)));
  assert.equal(broken.length, 0);
});

test("import './ui/select' inexistente => seção vira stub", () => {
  const f = {
    name: 'components/Booking.tsx',
    content: `import { Select } from './ui/select';
export default function Booking() { return <Select />; }
`,
  };
  const { stubbed } = enforceModuleIntegrity([GOOD_APP, f, ...UI_KIT_FILES]);
  assert.ok(stubbed.some(s => s.name === 'components/Booking.tsx' && /kit inexistente/.test(s.error)));
});

test('problema hard no App.tsx => broken (não pode virar stub)', () => {
  const badApp = {
    name: 'App.tsx',
    content: `export default function App() { return <div>{mysteryValue}</div>; }
`,
  };
  const { broken, stubbed } = enforceModuleIntegrity([badApp, ...UI_KIT_FILES]);
  assert.ok(broken.some(b => b.name === 'App.tsx'));
  assert.ok(!stubbed.some(s => s.name === 'App.tsx'));
});

test('dep npm fora da lista (date-fns) => warning, NÃO estuba', () => {
  const f = {
    name: 'components/Agenda.tsx',
    content: `import { format } from 'date-fns';
export default function Agenda() { return <div>{format(new Date(), 'yyyy')}</div>; }
`,
  };
  const { broken, stubbed, warnings } = enforceModuleIntegrity([GOOD_APP, GOOD_HEADER, f, ...UI_KIT_FILES]);
  assert.equal(stubbed.length, 0);
  assert.equal(broken.length, 0);
  assert.ok(warnings.some(w => /date-fns/.test(w)));
});

test('theme.ts (as const) não gera achado', () => {
  const theme = { name: 'theme.ts', content: `export const theme = { name: 'X', tagline: '', accent: '#6d28d9' } as const;\n` };
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, theme, ...UI_KIT_FILES]);
  assert.deepEqual(r.undefinedRefs, []);
  assert.deepEqual(r.parseErrors, []);
});

// ---------------------------------------------------------------------------
// V1.1 — checagem de exports entre arquivos + missing-file agora é "hard"
// ---------------------------------------------------------------------------
test('v1.1: named import inexistente (typo) => no-export => stub', () => {
  const f = {
    name: 'components/Nav.tsx',
    content: `import { Buton } from './ui/button';
export default function Nav() { return <Buton>x</Buton>; }
`,
  };
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, f, ...UI_KIT_FILES]);
  assert.ok(r.unresolvedImports.some(u => u.file === 'components/Nav.tsx' && u.reason === 'no-export' && u.name === 'Buton'));
  const { stubbed } = enforceModuleIntegrity([GOOD_APP, GOOD_HEADER, f, ...UI_KIT_FILES]);
  assert.ok(stubbed.some(s => s.name === 'components/Nav.tsx' && /export inexistente/.test(s.error)));
});

test('v1.1: default import de arquivo sem export default => stub', () => {
  const heroNamed = {
    name: 'components/Hero.tsx',
    content: `export function HeroBlock() { return <section>hero</section>; }\n`,
  };
  const consumer = {
    name: 'components/Landing.tsx',
    content: `import Hero from './Hero';
export default function Landing() { return <Hero />; }
`,
  };
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, heroNamed, consumer, ...UI_KIT_FILES]);
  assert.ok(r.unresolvedImports.some(u => u.file === 'components/Landing.tsx' && u.reason === 'no-default-export'));
  const { stubbed } = enforceModuleIntegrity([GOOD_APP, GOOD_HEADER, heroNamed, consumer, ...UI_KIT_FILES]);
  assert.ok(stubbed.some(s => s.name === 'components/Landing.tsx'));
  // Hero.tsx (named export) não é acusado de nada
  assert.ok(!stubbed.some(s => s.name === 'components/Hero.tsx'));
});

test('v1.1: import de arquivo .tsx inexistente => missing-file => stub (era warning)', () => {
  const f = {
    name: 'components/Home.tsx',
    content: `import Sidebar from './Sidebar';
export default function Home() { return <div><Sidebar /></div>; }
`,
  };
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, f, ...UI_KIT_FILES]);
  assert.ok(r.unresolvedImports.some(u => u.reason === 'missing-file' && u.spec === './Sidebar'));
  const { stubbed, broken } = enforceModuleIntegrity([GOOD_APP, GOOD_HEADER, f, ...UI_KIT_FILES]);
  assert.ok(stubbed.some(s => s.name === 'components/Home.tsx' && /não existe/.test(s.error)));
  assert.equal(broken.length, 0);
});

test('v1.1: import de .css inexistente => missing-asset => warning, NÃO estuba', () => {
  const f = {
    name: 'components/Gallery.tsx',
    content: `import './gallery.css';
export default function Gallery() { return <div>fotos</div>; }
`,
  };
  const { stubbed, broken, warnings } = enforceModuleIntegrity([GOOD_APP, GOOD_HEADER, f, ...UI_KIT_FILES]);
  assert.equal(stubbed.length, 0);
  assert.equal(broken.length, 0);
  assert.ok(warnings.some(w => /gallery\.css/.test(w)));
});

test('v1.1: import válido entre seções não gera achado', () => {
  const priceCard = {
    name: 'components/PriceCard.tsx',
    content: `export default function PriceCard() { return <div>R$</div>; }
export const CURRENCY = 'BRL';
`,
  };
  const pricing = {
    name: 'components/Pricing.tsx',
    content: `import PriceCard, { CURRENCY } from './PriceCard';
export default function Pricing() { return <section>{CURRENCY}<PriceCard /></section>; }
`,
  };
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, priceCard, pricing, ...UI_KIT_FILES]);
  assert.deepEqual(r.unresolvedImports, []);
  assert.deepEqual(r.undefinedRefs, []);
});

test('v1.1: import de um export type não gera falso no-export', () => {
  const categories = {
    name: 'data/categories.ts',
    content: `export type Category = { name: string; slug: string };
export const categories: Category[] = [{ name: 'A', slug: 'a' }];
`,
  };
  const posts = {
    name: 'data/posts.ts',
    content: `import { Category, categories } from './categories';
export type Post = { id: string; category: Category };
export const posts: Post[] = [{ id: '1', category: categories[0] }];
`,
  };
  const list = {
    name: 'components/PostList.tsx',
    content: `import { posts, Post } from '../data/posts';
export default function PostList() { return <ul>{posts.map((p: Post) => <li key={p.id}>{p.id}</li>)}</ul>; }
`,
  };
  const app = {
    name: 'App.tsx',
    content: `import PostList from './components/PostList';
export default function App() { return <div><PostList /></div>; }
`,
  };
  const r = analyzeProject([app, list, posts, categories, ...UI_KIT_FILES]);
  assert.deepEqual(r.unresolvedImports, [], JSON.stringify(r.unresolvedImports));
  const { broken, stubbed } = enforceModuleIntegrity([app, list, posts, categories, ...UI_KIT_FILES]);
  assert.equal(broken.length, 0, 'nada deveria quebrar: ' + JSON.stringify(broken));
  assert.equal(stubbed.length, 0, 'nada deveria virar stub: ' + JSON.stringify(stubbed));
});

test('v1.1: re-export (export * from) não gera falso no-export', () => {
  const barrel = { name: 'components/index.ts', content: `export * from './PriceCard';\n` };
  const priceCard = { name: 'components/PriceCard.tsx', content: `export const PriceCard = () => <div/>;\n` };
  const consumer = {
    name: 'components/Grid.tsx',
    content: `import { PriceCard, Whatever } from './index';
export default function Grid() { return <PriceCard />; }
`,
  };
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, barrel, priceCard, consumer, ...UI_KIT_FILES]);
  assert.ok(!r.unresolvedImports.some(u => u.file === 'components/Grid.tsx' && u.reason === 'no-export'));
});

// ---------------------------------------------------------------------------
// Portão: fallback determinístico do App.tsx (Preview nunca dá tela branca)
// ---------------------------------------------------------------------------
const BAD_APP = {
  name: 'App.tsx',
  content: `import Header from './components/Header';
import { Broken } from './components/DoesNotExist';
export default function App() { return <div><Header /><Broken /></div>; }
`,
};
const SCAFFOLD_APP = {
  name: 'App.tsx',
  content: `import Header from './components/Header';
export default function App() {
  return <div className="min-h-screen bg-background text-foreground"><Header /></div>;
}
`,
};

test('portão: App.tsx quebrado + fallback válido => recovered, não broken', () => {
  const { files, broken, recovered } = enforceModuleIntegrity(
    [BAD_APP, GOOD_HEADER, ...UI_KIT_FILES],
    [],
    { appFallback: SCAFFOLD_APP },
  );
  assert.ok(recovered.some(r => r.name === 'App.tsx'));
  assert.ok(!broken.some(b => b.name === 'App.tsx'));
  const app = files.find(f => f.name === 'App.tsx');
  assert.equal(app.content, SCAFFOLD_APP.content);
  compiles('App.tsx', app.content);
});

test('portão: fallback rejeitado se um import dele não resolve', () => {
  const badFallback = {
    name: 'App.tsx',
    content: `import Header from './components/Header';
import Missing from './components/Missing';
export default function App() { return <div><Header /><Missing /></div>; }
`,
  };
  const { broken, recovered } = enforceModuleIntegrity(
    [BAD_APP, GOOD_HEADER, ...UI_KIT_FILES],
    [],
    { appFallback: badFallback },
  );
  assert.equal(recovered.length, 0);
  assert.ok(broken.some(b => b.name === 'App.tsx'));
});

test('portão: sem appFallback, App.tsx quebrado continua broken', () => {
  const { broken, recovered } = enforceModuleIntegrity([BAD_APP, GOOD_HEADER, ...UI_KIT_FILES]);
  assert.equal(recovered.length, 0);
  assert.ok(broken.some(b => b.name === 'App.tsx'));
});

test('v1.1: namespace import (import * as X) não gera no-export', () => {
  const utils = { name: 'lib/format.ts', content: `export const brl = (n) => 'R$' + n;\n` };
  const f = {
    name: 'components/Cart.tsx',
    content: `import * as fmt from '../lib/format';
export default function Cart() { return <div>{fmt.brl(9)}</div>; }
`,
  };
  const r = analyzeProject([GOOD_APP, GOOD_HEADER, utils, f, ...UI_KIT_FILES]);
  assert.deepEqual(r.unresolvedImports.filter(u => u.file === 'components/Cart.tsx'), []);
});

console.log(`\n${passed} testes OK${process.exitCode ? ' — COM FALHAS' : ''}`);
