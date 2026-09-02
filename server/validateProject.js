// -----------------------------------------------------------------------------
// NEXA Engine 2.0 — Validation V1 (ver artifact "O Gap de Validação")
// -----------------------------------------------------------------------------
// Camada A: análise ESTÁTICA no servidor, sem executar o projeto e sem deps
// novas — só o @babel/standalone que o pipeline já usa.
//
//   analyzeProject(files)          -> { undefinedRefs, unresolvedImports,
//                                       unavailableDeps, parseErrors }
//   enforceModuleIntegrity(files)  -> { files, fixed, broken, stubbed, warnings }
//
// Pega as duas classes de erro que passavam pro Preview:
//   1) TSX com erro de sintaxe embarcado assim mesmo  -> portão de embarque
//   2) componente/identificador usado sem import       -> auto-import + portão
//
// NÃO toca no ProjectPlan/scaffold da Etapa 1 (só importa sectionStub p/ o
// portão). NÃO faz chamada de modelo.
// -----------------------------------------------------------------------------

import * as Babel from '@babel/standalone';
import { UI_KIT_FILES, UI_KIT_PATHS, UI_KIT_MODULES, UI_KIT_DEPENDENCIES } from './uiKit.js';
import { sectionStub } from './projectPlan.js';

const CODE_EXT = /\.(tsx|ts|jsx|js|mjs|cjs)$/i;

// Bare imports que o preview (Sandpack) tem garantido: react + o kit.
const ALLOWED_BARE = new Set([
  'react', 'react-dom', 'lucide-react',
  ...Object.keys(UI_KIT_DEPENDENCIES),
]);

// Identificadores globais legítimos no runtime do browser do Sandpack — não
// são "não definidos". Lista deliberadamente generosa: um falso positivo aqui
// faz o portão estubar uma seção que funcionava.
const GLOBALS = new Set([
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt', 'Function',
  'Math', 'JSON', 'Date', 'RegExp', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Proxy', 'Reflect', 'Intl', 'ArrayBuffer', 'DataView',
  'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
  'Error', 'TypeError', 'RangeError', 'SyntaxError', 'EvalError', 'ReferenceError',
  'URIError', 'AggregateError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'globalThis', 'undefined', 'NaN', 'Infinity', 'structuredClone', 'queueMicrotask',
  'console', 'window', 'document', 'navigator', 'location', 'history', 'self', 'top', 'parent',
  'localStorage', 'sessionStorage', 'indexedDB',
  'fetch', 'Headers', 'Request', 'Response', 'AbortController', 'AbortSignal',
  'XMLHttpRequest', 'FormData', 'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader', 'FileList',
  'WebSocket', 'EventSource', 'BroadcastChannel', 'MessageChannel', 'Worker',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback',
  'alert', 'confirm', 'prompt',
  'getComputedStyle', 'matchMedia', 'scrollTo', 'scrollBy', 'getSelection',
  'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'PerformanceObserver',
  'customElements', 'HTMLElement', 'HTMLInputElement', 'HTMLDivElement', 'HTMLButtonElement',
  'HTMLFormElement', 'HTMLAnchorElement', 'HTMLImageElement', 'HTMLCanvasElement',
  'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLVideoElement', 'HTMLAudioElement',
  'Element', 'Node', 'Text', 'DocumentFragment', 'ShadowRoot', 'Range',
  'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'TouchEvent',
  'FocusEvent', 'InputEvent', 'DragEvent', 'WheelEvent', 'SubmitEvent', 'ClipboardEvent',
  'crypto', 'performance', 'screen', 'devicePixelRatio',
  'DOMParser', 'XMLSerializer', 'TextEncoder', 'TextDecoder',
  'Image', 'Audio', 'Option', 'FontFace', 'Notification',
  'process', 'require', 'module', 'exports', '__dirname', '__filename', 'Buffer', 'global',
]);

// Hooks / helpers importáveis de 'react'.
const REACT_EXPORTS = new Set([
  'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer',
  'useLayoutEffect', 'useId', 'useTransition', 'useDeferredValue', 'useImperativeHandle',
  'useSyncExternalStore', 'useInsertionEffect', 'useDebugValue',
  'createContext', 'forwardRef', 'memo', 'lazy', 'Suspense', 'Fragment', 'StrictMode',
  'Profiler', 'createElement', 'cloneElement', 'isValidElement', 'Children', 'createRef',
  'startTransition', 'Component', 'PureComponent',
]);

// Ícones lucide-react comuns — todos exports REAIS da lib. Um nome PascalCase
// não-kit/não-react cai aqui só se estiver nesta lista (ou se o arquivo já
// importa de 'lucide-react' — aí é "esqueceu um ícone").
const LUCIDE_ICONS = new Set([
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowUpRight', 'ArrowDownRight',
  'ArrowUpLeft', 'ArrowDownLeft', 'MoveRight', 'CornerDownRight',
  'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown', 'ChevronsRight', 'ChevronsLeft',
  'ChevronsUp', 'ChevronsDown', 'ChevronsUpDown',
  'Check', 'CheckCheck', 'CheckCircle', 'CheckCircle2', 'CircleCheck', 'CircleCheckBig',
  'X', 'XCircle', 'CircleX', 'Plus', 'PlusCircle', 'CirclePlus', 'Minus', 'MinusCircle',
  'Menu', 'MoreHorizontal', 'MoreVertical', 'Ellipsis', 'EllipsisVertical', 'GripVertical',
  'Search', 'Filter', 'SlidersHorizontal', 'Settings', 'Settings2', 'Cog',
  'User', 'Users', 'UserPlus', 'UserCheck', 'UserCircle', 'CircleUser', 'UsersRound', 'Contact',
  'Mail', 'MailOpen', 'AtSign', 'Phone', 'PhoneCall', 'MessageSquare', 'MessageCircle',
  'MessagesSquare', 'Send', 'SendHorizontal', 'Inbox',
  'MapPin', 'Map', 'Navigation', 'Globe', 'Globe2', 'Compass', 'LocateFixed',
  'Calendar', 'CalendarDays', 'CalendarCheck', 'Clock', 'Clock3', 'Timer', 'History', 'Hourglass',
  'Star', 'Heart', 'HeartHandshake', 'ThumbsUp', 'ThumbsDown', 'Bookmark', 'Flag', 'Sparkle',
  'ShoppingCart', 'ShoppingBag', 'Package', 'PackageCheck', 'Truck', 'Gift', 'Tag', 'Tags',
  'CreditCard', 'DollarSign', 'Wallet', 'Receipt', 'BadgePercent', 'Percent', 'Coins', 'Banknote',
  'Home', 'Building', 'Building2', 'Store', 'Briefcase', 'Warehouse', 'Factory',
  'Eye', 'EyeOff', 'Lock', 'LockKeyhole', 'Unlock', 'Shield', 'ShieldCheck', 'ShieldAlert', 'Key',
  'Bell', 'BellOff', 'BellRing',
  'Download', 'Upload', 'Share', 'Share2', 'ExternalLink', 'Link', 'Link2', 'Copy', 'Clipboard',
  'ClipboardCheck', 'ClipboardList', 'Paperclip',
  'Trash', 'Trash2', 'Edit', 'Edit2', 'Edit3', 'Pencil', 'PencilLine', 'PenLine', 'Save', 'Undo', 'Redo',
  'File', 'FileText', 'FilePlus', 'FileCheck', 'Files', 'Folder', 'FolderOpen',
  'Image', 'ImageIcon', 'Images', 'Camera', 'Video', 'Film', 'Music', 'Music2', 'Headphones',
  'Play', 'Pause', 'CirclePlay', 'SkipForward', 'SkipBack', 'Volume2', 'VolumeX', 'Mic', 'MicOff',
  'Sun', 'Moon', 'SunMedium', 'CloudSun', 'Cloud', 'Zap', 'Sparkles', 'Flame', 'Droplet', 'Droplets',
  'Leaf', 'TreePine', 'Wind', 'Snowflake', 'Umbrella',
  'Wifi', 'WifiOff', 'Bluetooth', 'Battery', 'BatteryCharging', 'Signal', 'Rss', 'Cast',
  'Info', 'AlertCircle', 'CircleAlert', 'AlertTriangle', 'TriangleAlert', 'HelpCircle', 'CircleHelp', 'Ban',
  'Loader', 'Loader2', 'LoaderCircle', 'RefreshCw', 'RefreshCcw', 'RotateCw', 'RotateCcw',
  'List', 'ListChecks', 'ListOrdered', 'Grid', 'Grid2x2', 'Grid3x3', 'LayoutGrid', 'LayoutDashboard',
  'LayoutList', 'Columns', 'Rows', 'Table', 'Table2', 'Kanban', 'AlignLeft', 'AlignCenter', 'AlignRight',
  'Code', 'Code2', 'CodeXml', 'Terminal', 'TerminalSquare', 'Database', 'Server', 'Cpu', 'HardDrive',
  'Smartphone', 'Laptop', 'Monitor', 'Tablet', 'MousePointer', 'MousePointer2', 'Keyboard',
  'Award', 'Trophy', 'Medal', 'Target', 'Crosshair', 'Rocket', 'Gauge',
  'TrendingUp', 'TrendingDown', 'BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'PieChart',
  'LineChart', 'AreaChart', 'Activity', 'CandlestickChart',
  'Quote', 'BookOpen', 'Book', 'BookMarked', 'Newspaper', 'GraduationCap', 'Library', 'PenTool',
  'Coffee', 'Utensils', 'UtensilsCrossed', 'Pizza', 'Wine', 'Beer', 'CupSoda', 'Croissant', 'Soup',
  'Dumbbell', 'Bike', 'Car', 'Plane', 'Train', 'TrainFront', 'Ship', 'Bus', 'Footprints',
  'Facebook', 'Twitter', 'Instagram', 'Linkedin', 'Youtube', 'Github', 'Twitch', 'Dribbble',
  'Figma', 'Slack', 'Chrome',
  'Circle', 'CircleDot', 'Square', 'SquareCheck', 'Triangle', 'Hexagon', 'Diamond', 'Dot',
  'Palette', 'Brush', 'Paintbrush', 'PaintBucket', 'Wand', 'Wand2', 'Sparkles', 'Scissors', 'Ruler', 'Pipette',
  'Handshake', 'Building', 'Landmark', 'Scale', 'Gavel', 'Stamp',
  'Layers', 'Box', 'Boxes', 'Component', 'Puzzle', 'Blocks', 'Shapes',
  'Lightbulb', 'Rocket', 'Anchor', 'Feather', 'Fingerprint', 'Infinity', 'Aperture', 'Focus',
  'Plus', 'Play', 'Circle', 'Heart', 'ThumbsUp', 'Smile', 'Frown', 'Meh',
]);

// -----------------------------------------------------------------------------
// Mapa nome-de-export -> módulo do kit (Button -> button, CardHeader -> card…),
// montado uma vez a partir dos próprios arquivos do kit.
// -----------------------------------------------------------------------------
const KIT_EXPORT_TO_MODULE = new Map();
for (const f of UI_KIT_FILES) {
  const m = f.name.match(/^components\/ui\/([a-z0-9-]+)\.tsx$/);
  if (!m) continue;
  const mod = m[1];
  for (const exp of collectExportNames(f.content)) KIT_EXPORT_TO_MODULE.set(exp, mod);
}

/** Nomes exportados de um trecho — via Babel, tolerante a erro. */
function collectExportNames(code) {
  const names = [];
  try {
    Babel.transform(code, {
      presets: [['react', { runtime: 'automatic' }], 'typescript'],
      filename: 'k.tsx',
      plugins: [() => ({ visitor: {
        ExportNamedDeclaration(p) {
          const d = p.node.declaration;
          if (d) {
            if (d.id?.name) names.push(d.id.name);
            for (const decl of d.declarations || []) {
              if (decl.id?.name) names.push(decl.id.name);
            }
          }
          for (const s of p.node.specifiers || []) {
            if (s.exported?.name) names.push(s.exported.name);
          }
        },
      } })],
    });
  } catch { /* kit é estável; se um dia quebrar, só perde o auto-import */ }
  return names;
}

// -----------------------------------------------------------------------------
// Fatos de um arquivo: imports originais + identificadores livres (globais).
// Estratégia em 2 transforms: (1) full (react+ts) tira os tipos e vira JS puro;
// (2) analisa o JS -> scope.globals só tem referências de VALOR reais (sem
// falso positivo de tipo TS).
// -----------------------------------------------------------------------------
function fileFacts(name, content) {
  const imports = [];
  let jsCode;
  const tsxName = /\.ts$/i.test(name) ? name : name.replace(/\.[jt]sx?$/i, '.tsx');
  try {
    jsCode = Babel.transform(content, {
      presets: [['react', { runtime: 'automatic' }], 'typescript'],
      filename: tsxName,
      plugins: [() => ({ visitor: {
        ImportDeclaration(p) {
          if (p.node.importKind === 'type') return;
          const locals = (p.node.specifiers || [])
            .filter(s => s.importKind !== 'type')
            .map(s => s.local.name);
          imports.push({ source: p.node.source.value, locals });
        },
      } })],
    }).code;
  } catch (e) {
    return { parseError: (e.message || String(e)).split('\n')[0], imports: [], globals: [] };
  }

  let globals = [];
  try {
    Babel.transform(jsCode, {
      filename: 'x.js',
      plugins: [() => ({ visitor: { Program: { exit(p) { globals = Object.keys(p.scope.globals); } } } })],
    });
  } catch { globals = []; }

  return { parseError: null, imports, globals };
}

/** Resolve um import relativo contra o conjunto de nomes de arquivo (layout
 *  do pipeline: App.tsx, components/X.tsx, components/ui/x.tsx, lib/utils.ts). */
function resolveRelative(fromFile, spec, nameSet) {
  const dir = ('/' + fromFile.replace(/^\/+/, '')).split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') dir.pop();
    else dir.push(seg);
  }
  const base = dir.join('/').replace(/^\/+/, '');
  const cands = [
    base, `${base}.tsx`, `${base}.ts`, `${base}.jsx`, `${base}.js`,
    `${base}/index.tsx`, `${base}/index.ts`, `${base}/index.jsx`, `${base}/index.js`,
  ];
  return cands.some(c => nameSet.has(c));
}

/**
 * Análise estática do projeto inteiro. Não executa nada. Ignora os arquivos do
 * kit (são nossos). Retorna listas de achados — não corrige.
 */
export function analyzeProject(files) {
  const list = (files || []).filter(f => f && typeof f.name === 'string');
  const nameSet = new Set(list.map(f => f.name));
  const undefinedRefs = [];
  const unresolvedImports = [];
  const unavailableDeps = [];
  const parseErrors = [];

  for (const f of list) {
    if (!CODE_EXT.test(f.name) || UI_KIT_PATHS.has(f.name)) continue;
    const facts = fileFacts(f.name, f.content || '');

    if (facts.parseError) {
      parseErrors.push({ file: f.name, error: facts.parseError });
      continue;
    }

    for (const name of facts.globals) {
      if (GLOBALS.has(name)) continue;
      undefinedRefs.push({ file: f.name, name });
    }

    for (const imp of facts.imports) {
      const spec = imp.source;
      if (spec.startsWith('.')) {
        const ui = spec.match(/(?:^|\/)ui\/([a-z0-9-]+)$/i);
        if (ui && !UI_KIT_MODULES.has(ui[1])) {
          unresolvedImports.push({ file: f.name, spec, reason: 'kit-module' });
          continue;
        }
        if (!resolveRelative(f.name, spec, nameSet)) {
          unresolvedImports.push({ file: f.name, spec, reason: 'missing-file' });
        }
      } else {
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        if (!ALLOWED_BARE.has(pkg)) unavailableDeps.push({ file: f.name, pkg });
      }
    }
  }

  return { undefinedRefs, unresolvedImports, unavailableDeps, parseErrors };
}

// -----------------------------------------------------------------------------
// Auto-import determinístico
// -----------------------------------------------------------------------------
const PASCAL = /^[A-Z][A-Za-z0-9]*$/;

function importSources(content) {
  const out = new Set();
  const re = /^\s*import\b[^'"]*['"]([^'"]+)['"]/gm;
  let m;
  while ((m = re.exec(content))) out.add(m[1]);
  return out;
}

/** Mescla `names` num import de `source` já existente, ou cria um no topo. */
function addNamedImport(content, source, names) {
  const esc = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`import\\s+(?:[\\w$]+\\s*,\\s*)?\\{([^}]*)\\}\\s*from\\s*['"]${esc}['"]`);
  const m = content.match(re);
  if (m) {
    const have = new Set(
      m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean),
    );
    const add = names.filter(n => !have.has(n));
    if (add.length === 0) return content;
    const merged = m[0].replace(`{${m[1]}}`, `{ ${[...have, ...add].join(', ')} }`);
    return content.replace(m[0], merged);
  }
  return `import { ${names.join(', ')} } from '${source}';\n${content}`;
}

/**
 * Para os nomes não definidos de UM arquivo, adiciona os imports que dá pra
 * inferir com segurança: componentes do kit, hooks do react, ícones lucide.
 * Devolve { content, changed, unresolved } — `unresolved` = nomes que sobraram.
 */
export function autoImport(file, names) {
  const uniqueNames = [...new Set(names)];
  const srcs = importSources(file.content || '');
  const bySource = new Map();
  let needReactDefault = false;
  const unresolved = [];

  const push = (src, name) => {
    if (!bySource.has(src)) bySource.set(src, new Set());
    bySource.get(src).add(name);
  };

  for (const name of uniqueNames) {
    if (name === 'React') { needReactDefault = true; continue; }
    if (REACT_EXPORTS.has(name)) { push('react', name); continue; }
    const kitMod = KIT_EXPORT_TO_MODULE.get(name);
    if (kitMod) { push(`./ui/${kitMod}`, name); continue; }
    if (LUCIDE_ICONS.has(name) || (PASCAL.test(name) && srcs.has('lucide-react'))) {
      push('lucide-react', name);
      continue;
    }
    unresolved.push(name);
  }

  let content = file.content || '';
  for (const [src, set] of bySource) content = addNamedImport(content, src, [...set]);
  if (needReactDefault && !/^\s*import\s+React\b/m.test(content)) {
    content = `import React from 'react';\n${content}`;
  }

  return { content, changed: content !== (file.content || ''), unresolved };
}

// -----------------------------------------------------------------------------
// Portão de embarque
// -----------------------------------------------------------------------------
const SECTION_RE = /^components\/([A-Z][A-Za-z0-9_]*)\.tsx$/;

/**
 * Roda análise -> auto-import determinístico -> re-análise -> portão.
 * `priorBrokenNames`: arquivos que a validação de sintaxe (validateAndFixFiles)
 * não conseguiu consertar — tratados como "hard".
 *
 * Retorna:
 *  - files:   a lista final (com imports adicionados e seções irrecuperáveis
 *             trocadas por stub determinístico)
 *  - fixed:   arquivos que ganharam import automático
 *  - broken:  [{name,error}] que continuam quebrados e NÃO puderam virar stub
 *             (App.tsx, theme.ts, lib/*) — reportados, ainda embarcam
 *  - stubbed: [{name,error}] seções trocadas por stub pra o Preview montar
 *  - warnings:[string] problemas "soft" (dep npm fora da lista, import que não
 *             resolve) — não bloqueiam
 */
export function enforceModuleIntegrity(files, priorBrokenNames = []) {
  const out = (files || []).map(f => ({ ...f }));
  const prior = new Set(priorBrokenNames);

  // 1) análise + auto-import
  const r0 = analyzeProject(out);
  const undefByFile = new Map();
  for (const u of r0.undefinedRefs) {
    if (!undefByFile.has(u.file)) undefByFile.set(u.file, []);
    undefByFile.get(u.file).push(u.name);
  }
  const fixed = [];
  for (const f of out) {
    const names = undefByFile.get(f.name);
    if (!names || names.length === 0) continue;
    const res = autoImport(f, names);
    if (!res.changed) continue;
    // só aceita se continuar compilando
    if (fileFacts(f.name, res.content).parseError) continue;
    f.content = res.content;
    fixed.push(f.name);
  }

  // 2) re-análise + portão
  const r1 = analyzeProject(out);
  const hard = new Map();   // file -> [reasons]
  const soft = [];          // warnings
  const addHard = (file, reason) => {
    if (!hard.has(file)) hard.set(file, []);
    if (!hard.get(file).includes(reason)) hard.get(file).push(reason);
  };

  for (const u of r1.undefinedRefs) addHard(u.file, `'${u.name}' usado sem import/definição`);
  for (const p of r1.parseErrors) addHard(p.file, `não compila: ${p.error}`);
  for (const u of r1.unresolvedImports) {
    if (u.reason === 'kit-module') addHard(u.file, `importa '${u.spec}' — módulo de kit inexistente`);
    else soft.push(`${u.file}: import '${u.spec}' não resolve (arquivo ausente)`);
  }
  for (const name of prior) {
    if (out.some(f => f.name === name)) addHard(name, 'erro de sintaxe não corrigido');
  }
  for (const d of new Map(r1.unavailableDeps.map(x => [`${x.file}::${x.pkg}`, x])).values()) {
    soft.push(`${d.file}: importa '${d.pkg}' — fora das dependências do preview (pode não carregar)`);
  }

  const broken = [];
  const stubbed = [];
  for (const [file, reasons] of hard) {
    const error = reasons.join('; ');
    const sec = file.match(SECTION_RE);
    if (sec && !UI_KIT_PATHS.has(file)) {
      const i = out.findIndex(f => f.name === file);
      if (i >= 0) out[i] = { ...out[i], content: sectionStub(sec[1]) };
      stubbed.push({ name: file, error });
    } else {
      broken.push({ name: file, error });
    }
  }

  return { files: out, fixed, broken, stubbed, warnings: soft };
}
