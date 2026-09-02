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
    [GOOD_APP, SYNTAX_BROKEN, ...UI_KIT_FILES],
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
  const { stubbed, broken } = enforceModuleIntegrity([GOOD_APP, f, ...UI_KIT_FILES]);
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
  const { broken, stubbed, warnings } = enforceModuleIntegrity([GOOD_APP, f, ...UI_KIT_FILES]);
  assert.equal(stubbed.length, 0);
  assert.equal(broken.length, 0);
  assert.ok(warnings.some(w => /date-fns/.test(w)));
});

test('theme.ts (as const) não gera achado', () => {
  const theme = { name: 'theme.ts', content: `export const theme = { name: 'X', tagline: '', accent: '#6d28d9' } as const;\n` };
  const r = analyzeProject([GOOD_APP, theme, ...UI_KIT_FILES]);
  assert.deepEqual(r.undefinedRefs, []);
  assert.deepEqual(r.parseErrors, []);
});

console.log(`\n${passed} testes OK${process.exitCode ? ' — COM FALHAS' : ''}`);
