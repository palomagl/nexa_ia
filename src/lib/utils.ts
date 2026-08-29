import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type ApiErrorBody = {
  error?: string;
  details?: string;
  message?: string;
};

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('failed')
    );
  }

  return false;
}

/**
 * Lê uma resposta NDJSON (uma linha JSON por evento) e chama onEvent para
 * cada linha conforme ela chega, permitindo mostrar progresso ao vivo em
 * vez de esperar a resposta inteira do servidor fechar.
 */
export async function consumeNDJSONStream<T = any>(
  response: Response,
  onEvent: (event: T) => void
): Promise<void> {
  if (!response.body) {
    throw new Error('O navegador não suporta leitura de stream nesta resposta.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        onEvent(JSON.parse(trimmed) as T);
      } catch {
        // Linha incompleta/corrompida — ignora, o restante do stream segue.
      }
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    try {
      onEvent(JSON.parse(trailing) as T);
    } catch {
      // ignora resto incompleto no fim do stream
    }
  }
}

export interface AttachedImage {
  name: string;
  dataUrl: string;
}

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4MB

/**
 * Lê um único arquivo de imagem como data URL, pra anexar numa mensagem de
 * chat. Rejeita arquivos grandes demais (o payload vira base64 no corpo da
 * requisição, então precisa de uma margem sensata).
 */
export function readImageFile(file: File): Promise<AttachedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Só é possível anexar arquivos de imagem.'));
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      reject(new Error('Imagem muito grande (máx. 4MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result) });
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function formatServerError(
  status: number,
  data: ApiErrorBody | null | undefined,
  fallback: string
): string {
  if (status === 503) {
    return (
      data?.error ||
      'O Gemini está temporariamente sobrecarregado. Tente novamente em alguns segundos.'
    );
  }

  if (status === 400) {
    return data?.error || data?.details || fallback;
  }

  if (data?.details) {
    return data.details;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.message) {
    return data.message;
  }

  return fallback;
}
