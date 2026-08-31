/*
 * Driver de teste do motor de geração. Sobe o servidor (npm start) e roda:
 *   node test-generate.mjs
 * ou com prompts próprios:
 *   PROMPTS='["meu prompt 1","meu prompt 2"]' node test-generate.mjs
 *
 * Para cada prompt: chama /api/generate, coleta o evento `done` e faz uma
 * análise estática do resultado (arquivos, tema, validade de sintaxe,
 * uso do UI kit e dos tokens). Não renderiza — isso é no preview do app.
 */
import * as Babel from '@babel/standalone';

const BASE = process.env.NEXA_URL || 'http://localhost:3000';
const PROMPTS = process.env.PROMPTS
  ? JSON.parse(process.env.PROMPTS)
  : [
      'Landing page para uma cafeteria de especialidade chamada Aurora, com menu, seção sobre e contato',
      'Landing page de um SaaS de gestão de tarefas para times, com recursos, planos e FAQ',
      'Site de uma clínica de nutrição com equipe, serviços, depoimentos e formulário de agendamento',
      'Loja de roupas streetwear com vitrine de produtos, coleção em destaque e newsletter',
    ];

const CODE_EXT = /\.(tsx|ts|jsx|js)$/i;

function checkSyntax(name, content) {
  if (!CODE_EXT.test(name)) return null;
  try {
    Babel.transform(content || '', {
      presets: [['react', { runtime: 'automatic' }], 'typescript'],
      filename: name,
    });
    return null;
  } catch (e) {
    return e.message.split('\n')[0].slice(0, 100);
  }
}

async function run(prompt, i) {
  const t0 = Date.now();
  console.log(`\n\n========== TESTE ${i + 1}: ${prompt}`);

  let res;
  try {
    res = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  } catch (e) {
    console.log('  FALHA de conexão:', e.message);
    return;
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let done = null;
  let err = null;
  const phases = [];
  for (;;) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let ev;
      try { ev = JSON.parse(line); } catch { continue; }
      if (ev.type === 'phase') phases.push(ev.label || ev.phase);
      else if (ev.type === 'done') done = ev;
      else if (ev.type === 'error') err = ev;
    }
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`  tempo: ${secs}s | fases: ${phases.join(' > ')}`);
  if (err) { console.log('  ERRO:', err.error, '|', err.details); return; }
  if (!done) { console.log('  sem evento done'); return; }

  const files = done.files || [];
  const kit = files.filter(f => f.name.startsWith('components/ui/') || f.name === 'lib/utils.ts');
  const model = files.filter(f => !kit.includes(f));

  console.log(`  tema: ${done.theme?.id || '(NENHUM)'} — ${done.theme?.label || ''}`);
  console.log(`  fontes: ${done.theme?.fonts?.display || '?'} / ${done.theme?.fonts?.body || '?'}`);
  console.log(`  arquivos do modelo (${model.length}) + kit injetado (${kit.length}):`);

  let invalid = 0;
  for (const f of model) {
    const bad = checkSyntax(f.name, f.content);
    if (bad) invalid++;
    console.log(`    ${bad ? 'X ' : 'ok'} ${f.name.padEnd(36)} ${String(f.content.length).padStart(5)} ch${bad ? '  <- ' + bad : ''}`);
  }

  const app = files.find(f => /(^|\/)App\.tsx$/.test(f.name));
  const appSrc = app?.content || '';
  console.log(`  App.tsx: export default? ${/export default function App|export default App/.test(appSrc)} | importa componentes? ${/^import .+ from ['"]\.\/components\//m.test(appSrc)}`);
  console.log(`  usa o UI kit?           ${model.some(f => /from ['"][.\/]*(components\/)?ui\//.test(f.content))}`);
  console.log(`  usa tokens semânticos?  ${model.some(f => /\b(bg|text|border|ring)-(primary|secondary|muted|accent|foreground|background|card|destructive)\b/.test(f.content))}`);
  console.log(`  scaffold vazado?        ${model.some(f => /^(main\.tsx|index\.css|index\.html|tailwind\.config|vite\.config|package\.json)/.test(f.name))}`);
  console.log(`  pastas aninhadas?       ${model.some(f => (f.name.match(/\//g) || []).length > 1 && !f.name.startsWith('components/ui/'))}`);
  console.log(`  {{IMG:}} sobrando?      ${files.some(f => /\{\{IMG:/.test(f.content))} | brokenFiles: ${(done.brokenFiles || []).length}`);
  console.log(`  >>> sintaxe: ${model.length - invalid}/${model.length} arquivos do modelo válidos`);
}

for (let i = 0; i < PROMPTS.length; i++) await run(PROMPTS[i], i);
console.log('\n\n=== fim ===');
