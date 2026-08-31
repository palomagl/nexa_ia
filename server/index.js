import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { Mistral } from '@mistralai/mistralai';
import * as Babel from '@babel/standalone';
import {
  UI_KIT_FILES,
  UI_KIT_PATHS,
  UI_KIT_COMPONENT_NAMES,
  UI_KIT_CONTRACT,
} from './uiKit.js';
import { resolveTheme, renderThemeBlock } from './themes.js';

// Arquivos de scaffold que o front já fornece (preview e .zip). Se o modelo
// gerar algum, ignoramos — sobrescrever o main.tsx/index.css/config quebra
// o runtime do preview.
const SCAFFOLD_BLOCKLIST = /^(index\.html|main\.tsx|index\.css|vite-env\.d\.ts|(tailwind|postcss|vite)\.config\.[a-z]+|package(-lock)?\.json|tsconfig[^/]*\.json|\.?gitignore|README\.md)$/i;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/*
|--------------------------------------------------------------------------
| CADEIA DE FALLBACK ENTRE PROVEDORES DE IA (todos com camada gratuita)
|--------------------------------------------------------------------------
|
| AI_PROVIDER_CHAIN no server/.env define a ordem, ex.: "gemini,groq,mistral"
| (padrão). O servidor tenta o primeiro provedor da lista; se ele falhar
| com um erro "tente de novo" (429 de limite de uso, 5xx de sobrecarga,
| etc.), cai automaticamente pro próximo da lista — sem o usuário perceber.
| Só provedores com chave configurada entram na cadeia.
|
| Claude (anthropic) é pago e fica de fora da cadeia por padrão — só entra
| se você adicionar "anthropic" manualmente ao AI_PROVIDER_CHAIN.
|
*/

const PROVIDER_CHAIN_ORDER = (process.env.AI_PROVIDER_CHAIN || 'gemini,groq,mistral')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const mistralApiKey = process.env.MISTRAL_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
const mistralClient = mistralApiKey ? new Mistral({ apiKey: mistralApiKey }) : null;
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;

function isProviderConfigured(provider) {
  if (provider === 'gemini') return !!geminiApiKey;
  if (provider === 'groq') return !!groqApiKey;
  if (provider === 'mistral') return !!mistralApiKey;
  if (provider === 'anthropic') return !!anthropicApiKey;
  return false;
}

const ACTIVE_PROVIDER_CHAIN = PROVIDER_CHAIN_ORDER.filter(isProviderConfigured);

if (ACTIVE_PROVIDER_CHAIN.length === 0) {
  console.warn(
    `⚠️ Nenhuma chave configurada para a cadeia "${PROVIDER_CHAIN_ORDER.join(', ')}". ` +
    'Defina GEMINI_API_KEY, GROQ_API_KEY e/ou MISTRAL_API_KEY no arquivo server/.env'
  );
} else {
  console.log('🔗 Cadeia de IA ativa:', ACTIVE_PROVIDER_CHAIN.join(' → '));
}

// Teto real de saída. Gemini/Claude aceitam até ~65536; Groq/Mistral têm
// modelos com tetos de conclusão menores, por isso valores por provedor.
const MAX_OUTPUT_TOKENS = 65536;

// Apps grandes/multi-arquivo podem legitimamente demorar minutos pra gerar
// com um teto de tokens tão alto — os SDKs têm timeouts padrão bem mais
// curtos que isso, então damos folga generosa antes de desistir.
const PROVIDER_REQUEST_TIMEOUT_MS = 300000; // 5 minutos
// O modelo aceitaria até 65536, MAS a conta grátis do Groq tem uma cota de
// só 8.000 tokens por minuto (prompt + resposta somados) — nosso prompt
// sozinho já usa uns 3.000. Um teto alto aqui causa erro 413 na hora
// (request too large), não um "esperar e tentar de novo". Por isso o teto
// é bem menor que o do Gemini: é o fallback de emergência, não o principal.
const GROQ_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS) || 4000;
const MISTRAL_MAX_TOKENS = Number(process.env.MISTRAL_MAX_TOKENS) || 32000;

// gemini-2.5-flash é o que toda chave da camada grátis do AI Studio suporta
// (o -pro dá 404 em muitas contas grátis). Com a geração multi-passo
// (planejar → construir → revisar) o flash já entrega um resultado bem mais
// coeso que o tiro único. Se a sua chave TEM acesso ao pro, defina
// GEMINI_MODEL=gemini-2.5-pro no server/.env — a qualidade sobe bastante.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Papéis da geração multi-passo. Todos usam o Gemini primário por padrão;
// dá pra apontar cada um para um modelo diferente pelo .env se quiser.
const PLANNER_MODEL = process.env.PLANNER_MODEL || GEMINI_MODEL;
const BUILDER_MODEL = process.env.BUILDER_MODEL || GEMINI_MODEL;
const REVIEWER_MODEL = process.env.REVIEWER_MODEL || GEMINI_MODEL;

// Passo de auto-revisão depois de montar o app (1 rodada). Melhora o
// acabamento visual ao custo de +1 chamada de modelo. Desligue com
// GENERATE_REVIEW_PASS=false se estiver batendo em limite de cota.
const GENERATE_REVIEW_PASS = process.env.GENERATE_REVIEW_PASS !== 'false';

// claude-opus-5 é o mais capaz (melhor para código complexo); claude-sonnet-5
// é bem mais barato (~1/2.5 do preço) e ainda excelente para geração de UI.
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';
// Modelos de FALLBACK — precisam estar no tier GRÁTIS de cada provedor,
// senão a cadeia toda cai quando o Gemini dá 503/cota.
// - Groq descontinua modelos com frequência: IDs ativos em
//   https://console.groq.com/docs/models ou GET /openai/v1/models.
// - Mistral: mistral-large-latest / mistral-medium exigem plano pago
//   (403 tier_not_allowed). No tier grátis use mistral-small-latest,
//   open-mistral-nemo ou open-mistral-7b.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';

/*
|--------------------------------------------------------------------------
| IMAGENS — busca real por assunto (Pexels), nunca URL inventada
|--------------------------------------------------------------------------
|
| A IA não escreve a URL da imagem. Ela escreve um marcador tipo
| {{IMG: cozy coffee shop interior}} com uma descrição em inglês do que a
| foto deveria mostrar. O servidor resolve cada marcador buscando uma foto
| REAL relacionada ao assunto na API do Pexels (grátis) antes de mandar o
| código pro navegador. Sem PEXELS_API_KEY configurada, cai pro
| picsum.photos com a descrição como seed — a imagem nunca quebra, mas
| deixa de ser relacionada ao conteúdo.
|
*/

const pexelsApiKey = process.env.PEXELS_API_KEY;

if (!pexelsApiKey) {
  console.warn(
    '⚠️ PEXELS_API_KEY não definida — imagens vão usar picsum.photos (sempre ' +
    'carregam, mas não combinam com o assunto). Chave grátis e instantânea em ' +
    'https://www.pexels.com/api/'
  );
}

async function searchPexelsImage(query) {
  if (!pexelsApiKey) return null;

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: pexelsApiKey } });
    if (!res.ok) return null;

    const data = await res.json();
    const photo = data.photos && data.photos[0];
    return (photo && photo.src && (photo.src.large2x || photo.src.large || photo.src.original)) || null;
  } catch (error) {
    console.warn('⚠️ Falha ao buscar imagem no Pexels:', error.message);
    return null;
  }
}

function picsumFallback(query) {
  const seed = String(query || 'placeholder')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'placeholder';

  return `https://picsum.photos/seed/${seed}/1200/800`;
}

const IMAGE_MARKER_REGEX = /\{\{IMG:([^}]+)\}\}/g;

// Recebe uma lista de { name, content } e devolve a mesma lista com todo
// {{IMG: descrição}} trocado por uma URL de imagem real (Pexels, ou
// picsum.photos como fallback). Resolve cada descrição só uma vez, mesmo
// que apareça repetida em vários arquivos.
async function resolveImageMarkers(files) {
  const queries = new Set();

  for (const file of files) {
    const regex = new RegExp(IMAGE_MARKER_REGEX);
    let match;
    while ((match = regex.exec(file.content || ''))) {
      queries.add(match[1].trim());
    }
  }

  if (queries.size === 0) return files;

  const resolved = new Map();

  await Promise.all(
    [...queries].map(async query => {
      const url = (await searchPexelsImage(query)) || picsumFallback(query);
      resolved.set(query, url);
    })
  );

  return files.map(file => ({
    ...file,
    content: (file.content || '').replace(IMAGE_MARKER_REGEX, (_, rawQuery) => {
      const query = rawQuery.trim();
      return resolved.get(query) || picsumFallback(query);
    })
  }));
}

// Troca {{UPLOADED_IMAGE}} pela imagem que o usuário realmente anexou
// (paperclip no chat) — substituição literal, sem busca nenhuma.
function resolveUploadedImageMarker(files, attachment) {
  if (!attachment || !attachment.dataUrl) return files;

  const marker = '{{UPLOADED_IMAGE}}';
  return files.map(file => ({
    ...file,
    content: (file.content || '').split(marker).join(attachment.dataUrl)
  }));
}

// Erros que justificam tentar o próximo provedor da cadeia (limite de uso
// gratuito estourado, sobrecarga do lado do provedor, chave inválida etc.)
// — qualquer coisa que não seja um problema do nosso prompt em si.
function isRetryableProviderError(error) {
  const status = error?.status ?? error?.code;
  if ([401, 403, 404, 413, 429, 500, 502, 503, 529].includes(status)) return true;
  if (error?.name === 'APIConnectionError' || error?.name === 'AbortError' || error?.name === 'TimeoutError') {
    return true;
  }
  return /network|fetch failed|ECONNRESET|ETIMEDOUT|timed? ?out|aborted/i.test(
    `${error?.message || ''} ${error?.cause?.message || ''}`
  );
}

/**
 * Gera texto via streaming a partir de UM provedor específico.
 * Sempre um async generator de pedaços de texto puro (deltas).
 */
async function* streamFromProvider(provider, prompt, { temperature, model } = {}) {
  if (provider === 'groq') {
    // openai/gpt-oss-* é um "reasoning model" — sem isso ele gasta a
    // maior parte do (já escasso) orçamento de tokens "pensando" em vez
    // de escrever o código, e a resposta sai vazia/cortada.
    const stream = await groq.chat.completions.create(
      {
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: GROQ_MAX_TOKENS,
        reasoning_effort: 'low',
        stream: true
      },
      { timeout: PROVIDER_REQUEST_TIMEOUT_MS }
    );

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
    return;
  }

  if (provider === 'mistral') {
    // A camada gratuita do Mistral pode demorar mais que o timeout padrão
    // do SDK para uma geração grande — damos mais tempo antes de desistir.
    const stream = await mistralClient.chat.stream(
      {
        model: MISTRAL_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        maxTokens: MISTRAL_MAX_TOKENS
      },
      { timeoutMs: PROVIDER_REQUEST_TIMEOUT_MS }
    );

    for await (const event of stream) {
      const delta = event.data?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) yield delta;
    }
    return;
  }

  if (provider === 'anthropic') {
    const stream = anthropic.messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
    return;
  }

  // gemini (padrão)
  // Apps grandes/com muitas instruções podem demorar mais que o timeout
  // padrão do cliente HTTP — damos mais tempo antes de desistir.
  const stream = await ai.models.generateContentStream({
    model: model || GEMINI_MODEL,
    config: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature,
      httpOptions: { timeout: PROVIDER_REQUEST_TIMEOUT_MS }
    },
    contents: prompt
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

/**
 * Gera texto tentando cada provedor da cadeia em ordem. Se um provedor
 * falhar com erro recuperável, emite um evento `provider_switch` e tenta
 * o próximo — quem consome o generator deve descartar o texto acumulado
 * daquele provedor ao ver esse evento (a resposta recomeça do zero).
 */
async function* streamModelText(prompt, opts = {}) {
  if (ACTIVE_PROVIDER_CHAIN.length === 0) {
    throw new Error(
      'Nenhum provedor de IA está configurado (defina GEMINI_API_KEY, GROQ_API_KEY ou MISTRAL_API_KEY no server/.env).'
    );
  }

  let lastError = null;

  for (let i = 0; i < ACTIVE_PROVIDER_CHAIN.length; i++) {
    const provider = ACTIVE_PROVIDER_CHAIN[i];

    try {
      for await (const delta of streamFromProvider(provider, prompt, opts)) {
        yield { type: 'delta', provider, text: delta };
      }
      return;
    } catch (error) {
      lastError = error;
      const isLast = i === ACTIVE_PROVIDER_CHAIN.length - 1;
      const retryable = isRetryableProviderError(error);

      console.warn(
        `⚠️ [${provider}] falhou (${error?.status || error?.code || error?.message || 'erro'}).`,
        !isLast && retryable ? `Tentando "${ACTIVE_PROVIDER_CHAIN[i + 1]}"...` : 'Sem próximo provedor.'
      );

      if (!retryable || isLast) throw error;

      yield { type: 'provider_switch', from: provider, to: ACTIVE_PROVIDER_CHAIN[i + 1] };
    }
  }

  throw lastError;
}

/**
 * Roda um prompt do começo ao fim e devolve só o texto final (sem streaming
 * pro cliente). Usado nos passos internos da geração multi-passo (planejar,
 * revisar, regenerar arquivo) — o cliente só precisa ver o passo principal.
 * onChunk é opcional, pra repassar progresso "ao vivo" quando fizer sentido.
 */
async function collectModelText(prompt, { onChunk, ...opts } = {}) {
  let text = '';
  for await (const event of streamModelText(prompt, opts)) {
    if (event.type === 'provider_switch') {
      text = ''; // provedor trocou no meio — descarta o parcial e recomeça
      continue;
    }
    if (event.text) {
      text += event.text;
      onChunk?.(event.text);
    }
  }
  return text;
}

/*
|--------------------------------------------------------------------------
| RUNTIME DO PREVIEW — contrato compartilhado generate + chat
|--------------------------------------------------------------------------
*/

const STANDARD_STACK_CONTRACT = `
======================================================================
STACK E FORMATO DO CÓDIGO (OBRIGATÓRIO)
======================================================================

O código roda em um projeto Vite + React 18 + TypeScript + Tailwind CSS
normal (empacotado pelo Sandpack no preview, exportável como projeto real).

Escreva React + TypeScript PADRÃO:

- Use import / export de verdade (ESM). Nada de escopo global.
- UM componente principal por arquivo, com "export default".
- Arquivo de entrada: App.tsx, com "export default function App()".
- Hooks importados do react: import { useState, useEffect } from 'react'.
- Tipos TypeScript são bem-vindos, mas mantenha-os simples: um
  "type Props = { ... }" para as props de cada componente já basta.
  Nada de generics complicados, decorators ou classes.

ORGANIZAÇÃO DOS ARQUIVOS:

- Gere SOMENTE: App.tsx, theme.ts e arquivos em components/. NADA MAIS.
- NÃO gere index.html, src/main.tsx, src/index.css, tailwind.config.*,
  postcss.config.*, vite.config.*, package.json, tsconfig* — o projeto JÁ
  vem com tudo isso pronto. Se você gerar, será ignorado.
- Os caminhos nos marcadores ===FILE:...=== são relativos à pasta src/
  do projeto — escreva "App.tsx", "components/Header.tsx", "theme.ts"
  (NÃO escreva "src/App.tsx").
- App.tsx na raiz; componentes de seção em "components/NomeDaSecao.tsx".
  Use uma estrutura de pastas RASA — evite components/sections/... ou
  components/layout/...; deixe tudo em components/ direto.
- Imports ENTRE os arquivos gerados são relativos:
  import Header from './components/Header';
  import { theme } from '../theme';
- Um único "theme.ts" exporta a identidade visual (paleta, fontes, raio,
  sombra) como um objeto tipado; todos os componentes importam desse
  mesmo arquivo — é o que garante coerência visual entre as seções.
  Ex.: export const theme = { colors: { bg: '#0B0B0F', accent: '#7C5CFF' }, ... } as const;

DEPENDÊNCIAS DISPONÍVEIS:

- react, react-dom
- lucide-react  (ícones: import { Menu, X, ArrowRight } from 'lucide-react')

NÃO importe nenhuma outra biblioteca (sem react-router, sem framer-motion,
sem date libs, etc.) — use React puro para tudo (navegação/abas/modais via
useState).

ÍCONES:

Prefira lucide-react. SVG inline simples também é permitido. NÃO tente
desenhar ícones complexos à mão (dezenas de curvas) — é fácil corromper o
arquivo repetindo coordenadas. Na dúvida, use um ícone do lucide-react.

IMAGENS (OBRIGATÓRIO):

NUNCA escreva a URL da imagem você mesmo (nem Unsplash, nem picsum, nem
nenhuma). Use este marcador no lugar do src — o SERVIDOR troca por uma
foto REAL antes de o código chegar no navegador:

{{IMG: descrição curta em inglês do que a foto deveria mostrar}}

Ex.: <img src="{{IMG: cozy coffee shop interior with wooden tables}}" alt="Interior da cafeteria" className="w-full h-full object-cover" />

- Descrição SEMPRE em inglês, curta (3-8 palavras), específica.
- Cada imagem diferente = descrição diferente.
- alt em português, descritivo.
- Sempre object-cover + altura/largura controladas.

INTERATIVIDADE (botões e links NÃO PODEM "recarregar a página"):

- Todo <button> que não envia formulário PRECISA de type="button".
- Todo <form> PRECISA de onSubmit={(e) => { e.preventDefault(); ... }}.
- PROIBIDO <a href="#"> decorativo — se não há destino real, é uma AÇÃO:
  use <button type="button" onClick={...}>. Reserve <a> para link externo
  real (href de URL real, target="_blank" rel="noopener").
- Todo elemento que parece clicável precisa de um onClick de verdade.

CONTRASTE E CORES:

- Texto sempre com contraste forte sobre o fundo.
- 1 cor de destaque coerente com o negócio + neutros. Evite 3+ cores
  vibrantes brigando na mesma tela.

QUALIDADE NÃO PODE CAIR POR CAUSA DESSAS REGRAS. Ainda assim você DEVE
criar uma aplicação visualmente rica, completa e profissional, com
múltiplas seções e interatividade real.
`;

/*
|--------------------------------------------------------------------------
| AUXILIAR — parsear resposta do Gemini (formato de delimitadores)
|--------------------------------------------------------------------------
|
| Antes pedíamos ao Gemini um JSON com o código inteiro escapado dentro de
| uma string (\n, \", etc). Isso inflava o número de tokens de saída e era
| a principal causa de truncamento no meio da resposta.
|
| Agora pedimos texto puro com marcadores simples:
|
|   ===EXPLANATION===
|   texto...
|   ===FILE:App.tsx===
|   código puro, sem escaping...
|   ===END===
|
| Sem aspas escapadas, sem JSON.parse frágil — só cortar por marcador.
|
*/

function parseDelimitedResponse(text) {
  if (!text || !text.trim()) {
    throw new Error('A IA retornou uma resposta vazia.');
  }

  let raw = String(text).replace(/^﻿/, '').trim();

  // Alguns modelos ainda insistem em cercar tudo com ```; tiramos se vier.
  raw = raw.replace(/^```[a-zA-Z]*\s*/,'');
  raw = raw.replace(/\s*```$/, '');

  const markerRegex = /^[ \t]*===([A-Z]+)(?::([^=\r\n]*))?===[ \t]*$/gm;
  const markers = [];
  let match;

  while ((match = markerRegex.exec(raw)) !== null) {
    markers.push({
      type: match[1],
      arg: match[2] ? match[2].trim() : undefined,
      start: match.index,
      contentStart: match.index + match[0].length
    });
  }

  if (markers.length === 0) {
    console.error('❌ Nenhum marcador === encontrado na resposta.');
    console.error('🔎 Início da resposta recebida:', raw.slice(0, 500));
    throw new Error(
      'A resposta da IA não seguiu o formato esperado. Tente novamente.'
    );
  }

  const sections = [];

  for (let i = 0; i < markers.length; i++) {
    const current = markers[i];
    const next = markers[i + 1];
    const end = next ? next.start : raw.length;

    const content = raw
      .slice(current.contentStart, end)
      .replace(/^\r?\n/, '')
      .replace(/\r?\n[ \t]*$/, '');

    sections.push({ type: current.type, arg: current.arg, content });
  }

  return sections;
}

// Envia um evento NDJSON (uma linha JSON por evento) para o front, que lê o
// stream progressivamente em vez de esperar a resposta inteira fechar.
function writeStreamEvent(res, event) {
  res.write(JSON.stringify(event) + '\n');
}

/*
|--------------------------------------------------------------------------
| VALIDAÇÃO DE SINTAXE — parse React + TypeScript, arquivo por arquivo
|--------------------------------------------------------------------------
|
| O bundler (Sandpack no preview / Vite no export) resolve os imports —
| mas um único arquivo com JSX ou TS mal formado quebra o build inteiro,
| com uma mensagem de erro difícil de rastrear. Então checamos CADA
| arquivo isoladamente com o parser do Babel (preset react + typescript)
| antes de entregar. É só um teste de sintaxe: não resolvemos imports
| aqui, só confirmamos que o arquivo faz parse.
|
*/

const VALIDATABLE_LANGUAGES = new Set(['tsx', 'jsx', 'ts', 'js', undefined]);
// Só validamos código React/TS pela EXTENSÃO — os arquivos gerados chegam
// sem `language`, então sem isso o Babel tentaria parsear um .css/.json/.md
// e marcaria como quebrado sem motivo.
const CODE_FILE_EXT = /\.(tsx|ts|jsx|js|mjs|cjs)$/i;

function validateFileSyntax(file) {
  const name = file.name || 'App.tsx';
  if (!CODE_FILE_EXT.test(name)) {
    return { valid: true };
  }
  if (file.language && !VALIDATABLE_LANGUAGES.has(file.language)) {
    return { valid: true };
  }

  try {
    // filename com .tsx liga o parse de JSX no preset-typescript do Babel 8;
    // .ts / .js não ativam JSX (correto pra um theme.ts só com objeto).
    Babel.transform(file.content || '', {
      presets: [['react', { runtime: 'automatic' }], 'typescript'],
      filename: file.name || 'App.tsx'
    });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Tenta corrigir automaticamente um arquivo que falhou na validação,
// mandando pra IA o erro EXATO do Babel (mensagem + linha/coluna) e
// pedindo pra consertar só isso. Uma tentativa só.
async function fixBrokenFile(file, babelError) {
  // Prompt enxuto de propósito (sem o contrato de runtime inteiro): isso
  // costuma acontecer logo depois de um provedor com pouco orçamento de
  // tokens ter gerado o arquivo (por isso ele quebrou) — um prompt grande
  // aqui só disputa o mesmo orçamento apertado com a correção em si.
  const fixPrompt = `
O arquivo React abaixo NÃO compila. O parser (Babel) reportou este erro:

${babelError}

ARQUIVO ATUAL (${file.name}):
${file.content}

Muito provavelmente o arquivo foi CORTADO no meio (frase incompleta, tag
sem fechar, chave/parêntese faltando por falta de espaço). Se for esse o
caso, COMPLETE o arquivo de forma coerente com o que já existe — feche
todas as tags e blocos, termine a seção que ficou pela metade.

Regras (mesmas de sempre): React + TypeScript padrão, com import/export
reais; só react/react-dom/lucide-react como libs. Mantenha o mesmo design
e conteúdo, só termine/corrija o que está quebrado.

Responda em TEXTO PURO, sem JSON, sem \`\`\`, usando exatamente:

===FILE:${file.name}===
código completo corrigido
===END===
`;

  try {
    let fullText = '';
    for await (const event of streamModelText(fixPrompt, { temperature: 0.2 })) {
      if (event.type === 'delta' && event.text) fullText += event.text;
    }

    const sections = parseDelimitedResponse(fullText);
    const fixedSection = sections.find(s => s.type === 'FILE');
    if (!fixedSection || !fixedSection.content.trim()) return null;

    return { ...file, content: fixedSection.content.trim() };
  } catch (error) {
    console.warn(`⚠️ Falha ao tentar corrigir ${file.name} automaticamente:`, error.message);
    return null;
  }
}

// Valida todos os arquivos; para os que falharem, tenta 1 correção
// automática antes de desistir. brokenFiles lista os que continuaram
// quebrados mesmo depois da tentativa — pra avisar o usuário com clareza,
// em vez de entregar silenciosamente um app que não vai rodar.
async function validateAndFixFiles(files) {
  const result = [...files];
  const brokenFiles = [];

  for (let i = 0; i < result.length; i++) {
    const file = result[i];
    const check = validateFileSyntax(file);
    if (check.valid) continue;

    console.warn(`⚠️ ${file.name} tem erro de sintaxe, tentando corrigir automaticamente:`, check.error);
    const fixed = await fixBrokenFile(file, check.error);

    if (fixed && validateFileSyntax(fixed).valid) {
      console.log(`✅ ${file.name} corrigido automaticamente.`);
      result[i] = fixed;
    } else {
      console.error(`❌ Não foi possível corrigir ${file.name} automaticamente.`);
      brokenFiles.push({ name: file.name, error: check.error });
    }
  }

  return { files: result, brokenFiles };
}

/*
|--------------------------------------------------------------------------
| PROMPT PRINCIPAL — GERADOR DE PROJETOS
|--------------------------------------------------------------------------
*/

// Anexo de imagem do usuário (paperclip no chat): não temos visão
// computacional plugada em todos os provedores da cadeia, então em vez de
// mandar a imagem pro modelo "ver", damos um marcador — igual ao sistema
// {{IMG: ...}} — que o servidor troca pela imagem real depois. Funciona
// com QUALQUER provedor, sem precisar de suporte a visão.
function buildAttachmentInstructions(attachment) {
  if (!attachment || !attachment.name || !attachment.dataUrl) return '';

  return `
======================================================================
IMAGEM ANEXADA PELO USUÁRIO
======================================================================

O usuário anexou um arquivo de imagem chamado "${attachment.name}" junto
com este pedido. Você NÃO consegue ver o conteúdo dessa imagem — não
invente o que ela mostra.

Se o pedido sugerir usá-la (ex.: "usa essa imagem como logo", "coloca
essa foto no hero", "essa é a foto do produto"), use exatamente este
marcador no lugar do src, no local apropriado do layout:

{{UPLOADED_IMAGE}}

Exemplo: <img src="{{UPLOADED_IMAGE}}" alt="${attachment.name}" className="w-full h-full object-cover" />

É um arquivo único — o marcador só deve aparecer UMA vez em todo o
projeto. Se não estiver claro onde usar, escolha o local mais óbvio pelo
contexto (logo do header, imagem do hero, avatar, foto de produto).
`;
}

// Bloco opcional com o plano do passo 1 (arquitetura + design system). Quando
// presente, o modelo de construção deve SEGUIR esse plano à risca — é o que
// garante um app coeso e com muitos arquivos em vez de um App.tsx solto.
function buildPlanInstructions(plan) {
  if (!plan || !plan.trim()) return '';

  return `
======================================================================
PLANO APROVADO (SIGA À RISCA)
======================================================================

Um passo de planejamento já definiu a arquitetura, o design system e a
lista de arquivos desta aplicação. Você DEVE seguir este plano:

- Gere EXATAMENTE os arquivos listados no plano (mesmos caminhos), mais
  o theme.ts com o design system descrito (objeto exportado, importado
  pelos componentes).
- Use a paleta, as fontes e o tom definidos no plano — não invente outra
  identidade visual.
- Cada seção do plano precisa aparecer, completa, no app final.

${plan}
`;
}

function createGeneratePrompt(prompt, attachment, plan) {
  return `
Você é o Nexa AI, um designer de produto e engenheiro frontend sênior.

Sua função é transformar o pedido do usuário em uma aplicação React
visualmente excelente, funcional e pronta para apresentação a um cliente.

PEDIDO DO USUÁRIO:

${prompt}

${buildAttachmentInstructions(attachment)}

${buildPlanInstructions(plan)}

${STANDARD_STACK_CONTRACT}
${UI_KIT_CONTRACT}

======================================================================
OBJETIVO
======================================================================

Crie uma aplicação que pareça ter sido desenvolvida por uma equipe
profissional de UI/UX e frontend.

Não quero um template genérico.
Não quero uma página de tutorial com título, texto e um botão.

Analise o tipo de negócio, produto, serviço ou experiência e tome
decisões de design específicas para esse contexto.

O resultado deve parecer um produto real.

======================================================================
DESIGN E UI/UX
======================================================================

Pense como designer antes de escrever o código.

Para este pedido, escolha uma identidade visual coerente:

- paleta apropriada ao negócio (não use sempre as mesmas cores);
- tipografia hierárquica (hero grande, subtítulos claros, corpo legível);
- espaçamento consistente (seções com padding generoso, max-width no conteúdo);
- composição equilibrada e espaço negativo;
- Hero forte, memorável, com proposta de valor e CTA claro;
- cards, grids e seções com propósito;
- bordas, sombras e gradientes com moderação;
- estados hover e microinterações;
- navegação profissional (desktop + menu mobile);
- footer completo.

Evite:

- aparência de template pronto;
- excesso de blocos verdes/azuis/roxos sem composição;
- cards idênticos demais;
- textos genéricos repetidos ("Lorem ipsum", "Welcome to our website");
- layouts vazios;
- elementos gigantes sem necessidade;
- excesso de gradientes e sombras;
- design infantil quando o contexto for profissional.

Exemplos de direção (adapte ao pedido, não copie sempre):

- Nutricionista: natural, elegante, acolhedor.
- Cafeteria: aconchegante, artesanal, sofisticado, tons quentes.
- Startup de tecnologia: moderno, minimalista, preciso.
- Loja de roupas: editorial, sofisticado, fotográfico.

Não use sempre a mesma estrutura visual.

======================================================================
ESTRUTURA
======================================================================

Crie quantas seções forem necessárias para a aplicação ficar completa.

Considere, quando fizer sentido:

- Navbar com logo, links e CTA
- Hero
- apresentação / sobre
- benefícios
- serviços ou produtos
- categorias
- recursos
- estatísticas / números
- depoimentos
- planos
- equipe
- FAQ (accordion)
- formulário
- contato
- galeria
- chamada para ação
- footer com colunas, links e créditos

Não é obrigatório usar todas.
Escolha as seções que realmente fazem sentido.

A aplicação deve parecer funcional:

- menu mobile com estado aberto/fechado
- abas, filtros, accordions, modais
- formulários com estado
- hover e transições CSS
- carrossel simples com estado (sem libs)
- navegação entre seções ou views com React.useState

======================================================================
RESPONSIVIDADE
======================================================================

Deve funcionar muito bem em desktop, tablet e celular.

Use Tailwind (breakpoints sm/md/lg).

Adapte de verdade:

- tipografia
- grids (1 coluna no mobile)
- espaçamento
- navegação (menu hamburger no mobile)
- imagens (object-cover, alt, alturas controladas)
- botões e CTAs
- largura máxima do conteúdo (ex: max-w-6xl mx-auto)

(Regras de imagem, interatividade e cor já estão na seção RUNTIME DO
PREVIEW acima — siga-as à risca, especialmente a do marcador {{IMG: ...}}.)

======================================================================
QUALIDADE
======================================================================

Priorize nesta ordem:

1. qualidade visual
2. experiência do usuário
3. coerência do design
4. responsividade
5. funcionalidade
6. código organizado e compatível com o Preview

Não gere o menor código possível.
Prefira uma aplicação completa e refinada.

Textos devem parecer de um negócio real (nome, tom, ofertas, depoimentos).
PROIBIDO texto-placeholder: nada de "Lorem ipsum", "Seu texto aqui",
"Título da seção", "Bem-vindo ao nosso site". Escreva copy de verdade,
específica pro negócio — headline com proposta de valor, descrições reais,
2-4 depoimentos com nome e cargo plausíveis, itens de FAQ reais.

======================================================================
ESCALA (dimensione ao pedido)
======================================================================

- Pedido simples (1 landing, 1 tela): 4 a 6 arquivos
  (App.tsx + theme.ts + 2-4 componentes de seção).
- App / dashboard / site com várias páginas ou seções: 8 a 14 arquivos,
  um componente por seção/tela, cada um no seu arquivo.
- NUNCA entregue tudo num App.tsx só quando o app tem 3+ seções.
- App.tsx importa e compõe: layout + <Header/> <Hero/> <Secao/>... <Footer/>,
  com o estado de navegação no topo passado por props aos componentes.

======================================================================
FORMATO DA RESPOSTA
======================================================================

NÃO retorne JSON. NÃO use blocos de código Markdown (\`\`\`).

Retorne TEXTO PURO usando exatamente estes marcadores, cada um sozinho
em sua própria linha. Use UM bloco ===FILE:caminho=== por arquivo — o
caminho é relativo a src/ (ex.: App.tsx, theme.ts, components/Header.tsx):

===EXPLANATION===
Descrição curta da aplicação criada (1-2 frases).
===FILE:theme.ts===
export const theme = {
  colors: { bg: '#ffffff', text: '#0a0a0a', accent: '#6d28d9' },
} as const;
===FILE:App.tsx===
import Header from './components/Header';

export default function App() {
  return (
    <div>
      <Header />
    </div>
  );
}
===FILE:components/Header.tsx===
export default function Header() {
  return <header>...</header>;
}
===END===

Regras:

- Os marcadores ===EXPLANATION===, ===FILE:caminho=== e ===END=== devem
  aparecer exatamente assim, sozinhos na linha, sem texto extra.
- O conteúdo entre cada ===FILE:...=== e o próximo marcador é o
  código-fonte PURO desse arquivo, sem escaping, exatamente como um .tsx.
- NÃO coloque \`\`\` em nenhum lugar da resposta.
- App.tsx tem "export default function App()" e importa os demais arquivos
  por caminho relativo (./components/..., ./theme).
- Cada componente tem seu próprio "export default".

======================================================================
IMPORTANTE
======================================================================

Não explique como criar o site.
Crie o site.
Não faça um exemplo mínimo.
Crie uma experiência visual completa baseada no pedido.
`;
}

/*
|--------------------------------------------------------------------------
| GERAÇÃO MULTI-PASSO — planejar → construir → (regenerar buracos) → revisar
|--------------------------------------------------------------------------
|
| Um único prompt gigante "faça o app inteiro" com modelo fraco produz um
| App.tsx solto com cara de exemplo. Quebrando em passos, cada chamada tem
| um objetivo estreito e o resultado fica coeso e completo:
|
|  1. PLANEJAR  — arquitetura + design system + lista de arquivos/seções.
|  2. CONSTRUIR — gera todos os arquivos seguindo o plano (1 chamada grande).
|  3. BURACOS   — se algum arquivo do plano não veio, regenera só ele.
|  4. REVISAR   — 1 rodada de crítica de UI, devolve só os arquivos mexidos.
|
*/

// Versão enxuta das regras da stack — usada nos passos internos (regenerar
// arquivo, revisar), onde reembutir o contrato inteiro só gasta orçamento
// de tokens à toa.
const STACK_RULES_SHORT = `
REGRAS DA STACK (Vite + React 18 + TypeScript + Tailwind, empacotado de verdade):
- React + TS PADRÃO: import/export ESM, "export default" por componente, hooks do 'react'.
- Caminhos relativos a src/ (App.tsx, theme.ts, components/X.tsx); imports entre arquivos relativos (./components/X, ../theme).
- Libs: só react, react-dom, lucide-react. Nada além disso.
- Ícones: lucide-react (ou SVG inline simples).
- Imagens: use o marcador {{IMG: descrição curta em inglês}} no src, nunca URL própria.
- Todo <button> não-submit precisa de type="button"; todo <form> precisa de onSubmit com e.preventDefault().
- Nada de <a href="#"> — ação é <button type="button" onClick>.
- Contraste forte sempre; Tailwind pra tudo.
`;

// PASSO 1 — devolve um texto de plano (livre, legível) que vira contexto
// pros passos seguintes. Sem JSON frágil: o plano é injetado como prosa no
// prompt de construção.
async function planProject(prompt, attachment) {
  const planPrompt = `
Você é um diretor de arte + arquiteto frontend. NÃO escreva código agora.
Planeje uma aplicação React (Vite + React 18 + TypeScript + Tailwind,
single-page) para o pedido abaixo.

PEDIDO:
${prompt}
${attachment && attachment.name ? `\n(O usuário anexou a imagem "${attachment.name}".)` : ''}

Responda em TEXTO PURO, curto e direto, com estas 4 seções e nada mais:

===PLAN===
NEGÓCIO: nome fictício + 1 frase de posicionamento + tom de voz.

DESIGN SYSTEM:
- paleta: bg, surface, texto, texto-mudo, 1 cor de destaque (valores hex)
- fontes: 1 par (display + corpo), nomes de Google Fonts reais
- personalidade visual: raio de borda, uso de sombra, densidade, 2-3 adjetivos

ARQUIVOS (caminho relativo a src/ — responsabilidade em 1 linha):
- App.tsx — composição + estado de navegação
- theme.ts — o objeto theme exportado com o design system acima
- components/<Nome>.tsx — <seção> ...
(liste TODOS: 4-6 arquivos p/ landing simples, 8-14 p/ app com várias seções)

SEÇÕES (ordem de cima pra baixo na tela): lista curta.
===END===
`;

  const text = await collectModelText(planPrompt, {
    temperature: 0.4,
    model: PLANNER_MODEL,
  });

  const sections = (() => {
    try {
      return parseDelimitedResponse(text);
    } catch {
      return [];
    }
  })();

  const planSection = sections.find(s => s.type === 'PLAN');
  // Se o planner não seguiu o formato, usa o texto cru mesmo — ainda serve
  // de norte pro passo de construção. Só não deixa passar vazio.
  const planBody = (planSection && planSection.content.trim()) || text.trim();

  // Escolhe um tema curado pelo pedido + o que o planner descreveu, e crava
  // os valores no plano — o builder passa a usar paleta/tipografia prontas
  // em vez de inventar do zero.
  const { theme } = resolveTheme(prompt, planBody);
  return `${planBody}\n${renderThemeBlock(theme)}`;
}

// PASSO 3 — regenera UM arquivo que faltou ou veio vazio, dando o plano e os
// arquivos que já existem como contexto.
async function regenerateMissingFile(filePath, prompt, plan, existingFiles) {
  const context = existingFiles
    .map(f => `--- ${f.name} ---\n${f.content}`)
    .join('\n\n');

  const filePrompt = `
${STACK_RULES_SHORT}

Você está completando uma aplicação React que já foi parcialmente gerada.
PEDIDO ORIGINAL: ${prompt}

${plan ? `PLANO:\n${plan}\n` : ''}
ARQUIVOS JÁ EXISTENTES (não reescreva, só importe deles pelo caminho relativo):
${context}

Falta gerar SÓ este arquivo: ${filePath}
Gere-o completo, com import/export normais, coerente com o design e o
theme dos arquivos acima. Importe o que precisar deles por caminho relativo.

Responda em TEXTO PURO, exatamente:

===FILE:${filePath}===
código completo
===END===
`;

  const text = await collectModelText(filePrompt, { temperature: 0.6, model: BUILDER_MODEL });
  try {
    const section = parseDelimitedResponse(text).find(s => s.type === 'FILE');
    if (section && section.content.trim()) {
      return { name: filePath, content: section.content.trim() };
    }
  } catch {
    /* cai no null abaixo */
  }
  return null;
}

// PASSO 4 — auto-revisão de UI. Recebe o app montado, devolve SÓ os arquivos
// que valeu a pena mexer (0+). Uma rodada só.
async function reviewProject(prompt, plan, files) {
  // A revisão foca nos arquivos que decidem a COESÃO visual do app inteiro —
  // o design system e a composição/ritmo do App.tsx. Rever todos os
  // componentes um a um faz o flash regenerar tudo e a geração leva minutos.
  // Os demais arquivos vão só como contexto de leitura (não pra reescrever).
  // Só o App.tsx é reescrevível na revisão. Mexer no theme.ts é arriscado
  // (renomear uma chave do theme quebra todos os componentes que a importam,
  // sem erro de sintaxe) e mexer nos componentes um a um é lento.
  const isEditable = f => f.name.endsWith('App.tsx');

  const editable = files.filter(isEditable);
  const contextOnly = files.filter(f => !isEditable(f));

  if (editable.length === 0) return [];

  const editableDump = editable
    .map(f => `===FILE:${f.name}===\n${f.content}`)
    .join('\n\n');
  const contextDump = contextOnly
    .map(f => `--- ${f.name} (só leitura) ---\n${f.content}`)
    .join('\n\n');

  const reviewPrompt = `
${STACK_RULES_SHORT}

Você é um diretor de design fazendo a revisão final de coesão desta
aplicação React. Mantenha as regras da stack acima (import/export reais).

PEDIDO ORIGINAL: ${prompt}
${plan ? `\nPLANO:\n${plan}\n` : ''}
COMPONENTES (contexto, NÃO reescreva estes):
${contextDump}

ARQUIVOS QUE VOCÊ PODE AJUSTAR:
${editableDump}

Olhando o app como um todo, ajuste APENAS o App.tsx para elevar a coesão:
- compõe as seções com ritmo? (padding vertical consistente entre seções,
  max-width no conteúdo, ordem que faz sentido, fundo alternando quando ajuda)
- o header/nav e o footer estão presentes e completos?
- nada de <a href="#"> nem <form> sem e.preventDefault()?
- o estado de nav/tema/menu-mobile no topo está coerente com o que os
  componentes esperam receber por props?
Não invente componentes novos — use só os que já existem no contexto.

Devolva o App.tsx inteiro se mudou algo; senão devolva só ===MESSAGE===.

Responda em TEXTO PURO, exatamente:

===MESSAGE===
resumo curto do que você ajustou
===FILE:caminho===
arquivo inteiro revisado
===END===
`;

  const text = await collectModelText(reviewPrompt, { temperature: 0.4, model: REVIEWER_MODEL });
  try {
    const sections = parseDelimitedResponse(text);
    return sections
      .filter(s => s.type === 'FILE' && s.content.trim())
      .map(s => ({ name: s.arg || 'App.tsx', content: s.content.trim() }));
  } catch {
    return [];
  }
}

// Extrai os caminhos de arquivo citados no texto do plano ("- components/X.tsx — ...").
function extractPlannedPaths(plan) {
  if (!plan) return [];
  const paths = new Set();
  // Pega "App.tsx" e "components/Algo.tsx" em qualquer posição — o planner
  // costuma embrulhar em markdown (**App.tsx**, `App.tsx`, - App.tsx —).
  const regex = /((?:components\/)?[A-Z][A-Za-z0-9_]*\.tsx)/g;
  let match;
  while ((match = regex.exec(plan))) paths.add(match[1]);
  return [...paths];
}

/*
|--------------------------------------------------------------------------
| GERAR NOVO PROJETO
|--------------------------------------------------------------------------
*/

app.post('/api/generate', async (req, res) => {
  const { prompt, attachment, plan: providedPlan } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({
      error: 'O prompt não pode estar vazio!'
    });
  }

  // Resposta em NDJSON: uma linha JSON por evento, o front lê conforme chega.
  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders?.();

  let fullText = '';

  try {
    console.log('🚀 Gerando projeto:', prompt);

    // -------- PASSO 1: planejar --------
    // Se o cliente já revisou um plano no botão "Plan" da tela inicial, ele
    // vem no corpo da requisição e pulamos a chamada de planejamento aqui.
    let plan = typeof providedPlan === 'string' ? providedPlan.trim() : '';
    if (plan) {
      console.log('🧭 Usando plano enviado pelo cliente (%d chars).', plan.length);
    } else {
      writeStreamEvent(res, { type: 'phase', phase: 'planning', label: 'Planejando arquitetura e design...' });
      try {
        plan = await planProject(prompt, attachment);
        console.log('🧭 Plano gerado (%d chars). Arquivos previstos:', plan.length, extractPlannedPaths(plan));
      } catch (planError) {
        // Plano é um acelerador, não um pré-requisito — se falhar, segue sem ele.
        console.warn('⚠️ Falha ao planejar, seguindo sem plano:', planError.message);
      }
    }

    // -------- PASSO 2: construir --------
    writeStreamEvent(res, { type: 'phase', phase: 'building', label: 'Gerando os arquivos do projeto...' });
    const buildPrompt = createGeneratePrompt(prompt, attachment, plan);
    console.log('🧱 Prompt de construção: %d chars (~%d tokens)', buildPrompt.length, Math.round(buildPrompt.length / 4));
    for await (const event of streamModelText(
      buildPrompt,
      { temperature: 0.7, model: BUILDER_MODEL }
    )) {
      if (event.type === 'provider_switch') {
        // Provedor anterior falhou antes de terminar — descarta o texto
        // parcial dele e recomeça do zero com o próximo da cadeia.
        fullText = '';
        continue;
      }
      if (!event.text) continue;
      fullText += event.text;
      writeStreamEvent(res, { type: 'chunk', text: event.text });
    }

    const sections = parseDelimitedResponse(fullText);
    const fileSections = sections.filter(s => s.type === 'FILE');

    if (fileSections.length === 0) {
      throw new Error('A IA não retornou nenhum arquivo.');
    }

    let rawFiles = fileSections.map(s => ({
      // Normaliza o caminho: o modelo às vezes escreve "src/components/X.tsx",
      // às vezes "components/X.tsx". Padronizamos sem o "src/" — o front
      // recoloca o prefixo ao montar o bundle do Sandpack.
      name: (s.arg || 'App.tsx').replace(/^\.?\/*(src\/)?/, ''),
      content: s.content.trim()
    }));

    // Descarta arquivos de scaffold que o modelo insistiu em gerar — o front
    // já fornece index.html/main.tsx/index.css/configs.
    const droppedScaffold = rawFiles.filter(f => SCAFFOLD_BLOCKLIST.test(f.name)).map(f => f.name);
    if (droppedScaffold.length) console.log('🧹 Ignorando scaffold gerado pelo modelo:', droppedScaffold);
    rawFiles = rawFiles.filter(f => !SCAFFOLD_BLOCKLIST.test(f.name));

    // Injeta a biblioteca de componentes (Nexa UI kit, estilo shadcn) —
    // ela vai junto em todo projeto. Se o modelo tentou reescrever algum
    // arquivo do kit, a versão canônica ganha.
    rawFiles = rawFiles.filter(f => !UI_KIT_PATHS.has(f.name));
    rawFiles.push(...UI_KIT_FILES.map(f => ({ ...f })));

    // -------- PASSO 2b: garantir App.tsx --------
    // O flash às vezes gera só os componentes e "esquece" o App.tsx (e o
    // ===END===). Sem App.tsx o projeto inteiro não roda, então geramos um.
    if (!rawFiles.some(f => f.name === 'App.tsx' || f.name.endsWith('/App.tsx'))) {
      console.log('🩹 App.tsx não veio — gerando a composição a partir dos componentes.');
      writeStreamEvent(res, { type: 'phase', phase: 'building', label: 'Montando o App.tsx...' });
      const appFileGen = await regenerateMissingFile('App.tsx', prompt, plan, rawFiles);
      if (appFileGen) {
        rawFiles.unshift(appFileGen);
      } else {
        // Fallback mínimo: importa e compõe todos os componentes conhecidos.
        const comps = rawFiles
          .filter(f => /^components\/[A-Z][A-Za-z0-9_]*\.tsx$/.test(f.name))
          .map(f => f.name.replace(/^components\//, '').replace(/\.tsx$/, ''));
        rawFiles.unshift({
          name: 'App.tsx',
          content:
            comps.map(c => `import ${c} from './components/${c}';`).join('\n') +
            `\n\nexport default function App() {\n  return (\n    <div>\n` +
            comps.map(c => `      <${c} />`).join('\n') +
            `\n    </div>\n  );\n}\n`,
        });
      }
    }

    // -------- PASSO 3: preencher buracos do plano --------
    // Só entra em ação se a construção veio claramente incompleta (poucos
    // arquivos). Se o build já produziu um app multi-arquivo decente,
    // confiamos nele — cada regeneração é uma chamada de modelo a mais, e
    // numa chave grátis isso vira minutos de espera.
    const referencedComponents = [
      ...(rawFiles.find(f => f.name.endsWith('App.tsx'))?.content || '').matchAll(/<([A-Z][A-Za-z0-9_]*)\s*\/?>/g),
    ].map(m => m[1]);
    const haveNames = new Set(rawFiles.map(f => f.name));
    const haveComponentBaseNames = new Set(
      rawFiles.map(f => f.name.replace(/^components\//, '').replace(/\.tsx$/, ''))
    );

    // Componentes que o App.tsx usa mas nenhum arquivo declara (os do UI kit
    // já existem — não conte <Button/>, <Card/>, <Tabs/> como buraco).
    let missing = [...new Set(referencedComponents)]
      .filter(name => !haveComponentBaseNames.has(name) && name !== 'App' && !UI_KIT_COMPONENT_NAMES.has(name))
      .map(name => `components/${name}.tsx`)
      .filter(p => !haveNames.has(p));

    // Rede de segurança: se mesmo assim só veio o App.tsx (fora o UI kit),
    // puxa os primeiros arquivos do plano.
    if (rawFiles.filter(f => !UI_KIT_PATHS.has(f.name)).length <= 1) {
      const fromPlan = extractPlannedPaths(plan).filter(
        p => p !== 'App.tsx' && !haveNames.has(p)
      );
      missing = [...new Set([...missing, ...fromPlan])];
    }

    if (missing.length > 0) {
      const toFill = missing.slice(0, 4);
      console.log('🩹 Componentes referenciados sem arquivo, regenerando:', toFill);
      writeStreamEvent(res, { type: 'phase', phase: 'building', label: `Completando ${toFill.length} arquivo(s)...` });
      for (const filePath of toFill) {
        const regenerated = await regenerateMissingFile(filePath, prompt, plan, rawFiles);
        if (regenerated) rawFiles.push(regenerated);
      }
    }

    // -------- PASSO 4: auto-revisão de UI --------
    if (GENERATE_REVIEW_PASS) {
      try {
        writeStreamEvent(res, { type: 'phase', phase: 'reviewing', label: 'Revisão final de design...' });
        const revised = await reviewProject(prompt, plan, rawFiles);
        // A revisão só pode MELHORAR, nunca quebrar. Só aceitamos um arquivo
        // revisado se: (1) já existe com esse nome exato — nada de criar
        // arquivo novo, evita <Header/> duplicado; (2) ele compila no mesmo
        // Babel do Preview; (3) mudou de verdade. Caso contrário, mantém o
        // original. (O flash costuma reescrever tudo mesmo mandado não fazer.)
        const byName = new Map(rawFiles.map(f => [f.name, f]));
        const applied = [];
        for (const r of revised) {
          const original = byName.get(r.name);
          if (!original || !r.content.trim()) continue;
          if (r.content.trim() === original.content.trim()) continue;
          if (!validateFileSyntax({ name: r.name, content: r.content, language: 'tsx' }).valid) {
            console.warn(`⚠️ Revisão de ${r.name} não compila — mantendo a versão anterior.`);
            continue;
          }
          byName.set(r.name, { ...original, content: r.content.trim() });
          applied.push(r.name);
        }
        if (applied.length > 0) {
          console.log('🎨 Revisão aplicada em:', applied);
          rawFiles = [...byName.values()];
        }
      } catch (reviewError) {
        console.warn('⚠️ Passo de revisão falhou (seguindo com a versão anterior):', reviewError.message);
      }
    }

    console.log('🖼️ Resolvendo imagens ({{IMG: ...}}) via Pexels...');
    const filesWithImages = resolveUploadedImageMarker(
      await resolveImageMarkers(rawFiles),
      attachment
    );

    console.log('🔍 Validando sintaxe dos arquivos...');
    const { files, brokenFiles } = await validateAndFixFiles(filesWithImages);

    const appFile =
      files.find(f => f.name === 'App.tsx' || f.name.endsWith('App.tsx')) ||
      files[0];

    if (!appFile || !appFile.content) {
      throw new Error('A IA não retornou o arquivo App.tsx.');
    }

    const explanationSection = sections.find(s => s.type === 'EXPLANATION');

    // Tema curado escolhido pra este projeto — o front aplica a mesma paleta
    // nos tokens do Tailwind do preview e do .zip.
    const { theme: chosenTheme } = resolveTheme(prompt, plan);
    const themePayload = {
      id: chosenTheme.id,
      label: chosenTheme.label,
      palette: chosenTheme.palette,
      fonts: chosenTheme.fonts,
      radius: chosenTheme.radius,
    };

    console.log('📁 Arquivos gerados:', files.map(f => f.name));
    console.log('🎨 Tema:', chosenTheme.id);
    console.log('📦 Tamanho do App.tsx:', appFile.content.length, 'caracteres');
    console.log('✅ Projeto gerado com sucesso');

    if (brokenFiles.length > 0) {
      console.error('⚠️ Arquivos com erro de sintaxe não corrigido:', brokenFiles.map(f => f.name));
    }

    writeStreamEvent(res, {
      type: 'done',
      files,
      brokenFiles,
      theme: themePayload,
      explanation:
        (explanationSection && explanationSection.content.trim()) ||
        'Projeto criado com sucesso pelo Nexa AI.'
    });

    return res.end();

  } catch (error) {
    console.error('❌ ERRO AO GERAR PROJETO:', error);

    const isOverloaded = [503, 529].includes(error?.status) || [503, 529].includes(error?.code);

    writeStreamEvent(res, {
      type: 'error',
      error: isOverloaded
        ? 'A IA está temporariamente sobrecarregada. Tente novamente em alguns segundos.'
        : 'Erro ao gerar o projeto com a IA.',
      details: error?.message || String(error)
    });

    return res.end();
  }
});

/*
|--------------------------------------------------------------------------
| CHAT / MODIFICAÇÃO DO PROJETO
|--------------------------------------------------------------------------
*/

app.post('/api/chat', async (req, res) => {
  const {
    prompt,
    files = [],
    history = [],
    attachment
  } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({
      error: 'O prompt não pode estar vazio!'
    });
  }

  // Resposta em NDJSON: uma linha JSON por evento, o front lê conforme chega.
  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders?.();

  let fullText = '';

  try {
    console.log(
      '💬 Prompt recebido:',
      prompt
    );

    const projectFiles = files
      .map((file) => `
NAME: ${file.name || ''}
TYPE: ${file.type || ''}
LANGUAGE: ${file.language || 'unknown'}

CONTENT:
${file.content || ''}
`)
      .join('\n--------------------\n');

    const previousMessages = history
      .slice(-10)
      .map(
        (message) =>
          `${message.role}: ${message.content}`
      )
      .join('\n');

    const chatPrompt = `
Você é o Nexa AI, um designer de produto e engenheiro frontend sênior
especializado em React, JavaScript, JSX, Tailwind CSS e UI/UX.

O usuário quer modificar o projeto ATUAL que já está aberto no editor.
O projeto pode ter mais de um arquivo (App.tsx + components/*.tsx).
Você deve editar os arquivos existentes — não começar um projeto do zero,
a menos que o usuário peça explicitamente para recriar tudo.

PEDIDO:

${prompt}

${buildAttachmentInstructions(attachment)}

======================================================================
PROJETO ATUAL
======================================================================

${projectFiles}

======================================================================
HISTÓRICO
======================================================================

${previousMessages}

${STANDARD_STACK_CONTRACT}
${UI_KIT_CONTRACT}

Os arquivos em components/ui/ e lib/utils.ts são a biblioteca do projeto —
NÃO os inclua na resposta, NÃO os reescreva. Só edite os arquivos de
seção / App.tsx.

======================================================================
OBJETIVO
======================================================================

Analise TODOS os arquivos do projeto atual antes de alterar.

Faça exatamente as mudanças pedidas.

Não remova funcionalidades existentes sem necessidade.
Não destrua o design existente sem motivo.
Mantenha a identidade visual, a menos que o pedido seja mudar o visual.

Quando a mudança for visual, faça uma melhoria real de UI/UX.

Se o usuário pedir, por exemplo:

- "deixe o botão azul"
- "adicione uma seção de depoimentos"
- "mude as cores"
- "deixe o site mais elegante"

você DEVE atualizar o(s) arquivo(s) necessário(s), completos, já com
essa alteração aplicada.

Se o usuário reportar um problema (ex.: "as imagens não aparecem",
"o botão reinicia a página", "clicar não faz nada", "as cores estão
feias"), esse é EXATAMENTE o tipo de bug coberto pelas seções IMAGENS,
INTERATIVIDADE e CONTRASTE E CORES do contrato da stack acima —
revise TODO o arquivo procurando essas violações específicas (URLs de
imagem inventadas, <button> sem type="button" dentro de <form>, <form>
sem preventDefault, <a href="#">, contraste ruim) e corrija todas as
ocorrências, não só a primeira.

REGRA CRÍTICA — QUANDO O PEDIDO É UMA MUDANÇA, VOCÊ TEM QUE DEVOLVER
ARQUIVO. Se o usuário pediu qualquer alteração, correção, adição ou
ajuste (praticamente todo pedido que não seja uma pergunta pura), a sua
resposta É OBRIGADA a conter pelo menos um bloco ===FILE:caminho=== com o
arquivo inteiro modificado. Responder só com ===MESSAGE=== ("pronto, deixei
azul") SEM bloco de arquivo é considerado uma FALHA — a mudança não chega
no projeto do usuário. Na dúvida sobre se algo é mudança, trate como
mudança e devolva o arquivo.

Só inclua os arquivos que você REALMENTE mudou ou criou — não reenvie
arquivos intocados. Se a mudança cabe num arquivo só (ex.: só o Header),
devolva SÓ esse arquivo — mas devolva.

Se fizer sentido extrair uma seção nova para um arquivo próprio (ex.:
criar components/Testimonials.tsx), pode criar — desde que App.tsx
também seja atualizado para importar e usar esse novo componente.

======================================================================
FORMATO
======================================================================

NÃO retorne JSON. NÃO use blocos de código Markdown (\`\`\`).

Retorne TEXTO PURO usando exatamente estes marcadores, cada um sozinho
em sua própria linha:

===MESSAGE===
Resumo curto da alteração realizada.
===FILE:App.tsx===
import Header from './components/Header';

export default function App() {
  ...arquivo COMPLETO já atualizado, com import/export normais...
}
===FILE:components/Header.tsx===
export default function Header() {
  ...arquivo COMPLETO, só se este arquivo também mudou...
}
===END===

Regras:

- Cada ===FILE:caminho=== deve conter o arquivo INTEIRO já com a
  mudança aplicada, nunca um trecho/diff.
- Inclua um bloco ===FILE:caminho=== por arquivo criado ou alterado.
  NÃO inclua arquivos que não mudaram.
- Para excluir um arquivo que não é mais necessário, use
  ===DELETE:caminho=== (sozinho, sem conteúdo depois).
- O conteúdo é código-fonte PURO, sem escaping e sem \`\`\`.
- A resposta SÓ com ===MESSAGE=== (sem nenhum ===FILE===) é permitida
  EXCLUSIVAMENTE quando o usuário fez uma pergunta pura e não pediu
  nenhuma mudança (ex.: "que cor é esse botão?", "quantas seções tem?").
  Para qualquer pedido de alteração, incluir arquivo é obrigatório.

===MESSAGE===
Explicação curta.
===END===
`;

    for await (const event of streamModelText(chatPrompt, { temperature: 0.6, model: BUILDER_MODEL })) {
      if (event.type === 'provider_switch') {
        fullText = '';
        continue;
      }
      if (!event.text) continue;
      fullText += event.text;
      writeStreamEvent(res, { type: 'chunk', text: event.text });
    }

    const sections = parseDelimitedResponse(fullText);
    const messageSection = sections.find(s => s.type === 'MESSAGE');
    const normalizeFilePath = p => (p || 'App.tsx').replace(/^\.?\/*(src\/)?/, '');
    const isProtected = p => UI_KIT_PATHS.has(p) || SCAFFOLD_BLOCKLIST.test(p);
    // Ignora tentativas de reescrever a biblioteca do kit ou o scaffold.
    const fileSections = sections
      .filter(s => s.type === 'FILE')
      .filter(s => !isProtected(normalizeFilePath(s.arg)));
    const deleteSections = sections
      .filter(s => s.type === 'DELETE')
      .filter(s => !isProtected(normalizeFilePath(s.arg)));

    const fileActions = fileSections.map(s => ({
      type: 'update_file',
      file: normalizeFilePath(s.arg),
      content: s.content.trim()
    }));

    // Resolve {{IMG: ...}} de uma vez só, reaproveitando buscas repetidas
    // entre arquivos diferentes da mesma resposta, e {{UPLOADED_IMAGE}}
    // pela imagem que o usuário realmente anexou (se houver).
    const resolvedFileContents = resolveUploadedImageMarker(
      await resolveImageMarkers(
        fileActions.map(a => ({ name: a.file, content: a.content }))
      ),
      attachment
    );

    console.log('🔍 Validando sintaxe dos arquivos alterados...');
    const { files: validatedFileContents, brokenFiles } = await validateAndFixFiles(resolvedFileContents);

    const resolvedFileActions = fileActions.map((action, i) => ({
      ...action,
      content: validatedFileContents[i].content
    }));

    const actions = [
      ...resolvedFileActions,
      ...deleteSections
        .filter(s => s.arg)
        .map(s => ({ type: 'delete_file', file: normalizeFilePath(s.arg) }))
    ];

    if (brokenFiles.length > 0) {
      console.error('⚠️ Arquivos com erro de sintaxe não corrigido:', brokenFiles.map(f => f.name));
    }

    console.log(
      '🤖 Ações retornadas:',
      actions.length
    );

    writeStreamEvent(res, {
      type: 'done',
      message: (messageSection && messageSection.content.trim()) || 'Alteração concluída.',
      actions,
      brokenFiles
    });

    return res.end();

  } catch (error) {
    console.error(
      '❌ ERRO NO CHAT:',
      error
    );

    const isOverloaded = [503, 529].includes(error?.status) || [503, 529].includes(error?.code);

    writeStreamEvent(res, {
      type: 'error',
      error: isOverloaded
        ? 'A IA está temporariamente sobrecarregada. Tente novamente em alguns segundos.'
        : 'Erro ao modificar o projeto com a IA.',
      details: error?.message || String(error)
    });

    return res.end();
  }
});

/*
|--------------------------------------------------------------------------
| PLANEJAR (preview) — só o passo 1, pro botão "Plan" da tela inicial
|--------------------------------------------------------------------------
|
| Roda apenas planProject() e devolve o texto do plano. O usuário revê,
| e ao mandar gerar o front reenvia esse mesmo plano no corpo de
| /api/generate, que então pula o passo de planejamento.
|
*/

app.post('/api/plan', async (req, res) => {
  const { prompt, attachment } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'O prompt não pode estar vazio!' });
  }

  try {
    console.log('🧭 Planejando (preview):', prompt);
    const plan = await planProject(prompt.trim(), attachment);

    if (!plan || !plan.trim()) {
      return res.status(502).json({ error: 'A IA não retornou um plano. Tente novamente.' });
    }

    return res.json({ plan: plan.trim() });
  } catch (error) {
    console.error('❌ ERRO AO PLANEJAR:', error);
    const isOverloaded = [503, 529].includes(error?.status) || [503, 529].includes(error?.code);
    return res.status(isOverloaded ? 503 : 500).json({
      error: isOverloaded
        ? 'A IA está temporariamente sobrecarregada. Tente novamente em alguns segundos.'
        : 'Erro ao planejar o projeto.',
      details: error?.message || String(error),
    });
  }
});

/*
|--------------------------------------------------------------------------
| TESTE DO SERVIDOR
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nexa AI Server online 🚀'
  });
});

app.listen(port, () => {
  console.log(
    `🚀 Servidor rodando em http://localhost:${port}`
  );
});
