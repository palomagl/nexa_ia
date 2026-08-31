import { useCallback, useRef, useState } from 'react';

interface UseVoiceInputOptions {
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
}

// Ditado por voz via Web Speech API — recurso nativo do navegador (Chrome/
// Edge), sem custo e sem chave de API. Em navegadores sem suporte (ex.:
// Firefox), avisa com onError em vez de falhar silenciosamente.
export function useVoiceInput({ onResult, onError }: UseVoiceInputOptions) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      onError?.('Seu navegador não suporta ditado por voz. Tente no Chrome ou Edge.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        onError?.('Não foi possível reconhecer sua voz. Tente de novo.');
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onResult, onError]);

  return { listening, toggleListening };
}
