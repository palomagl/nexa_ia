/// <reference types="vite/client" />

interface ImportMetaEnv {
  // URL do backend Express. Ver .env.example.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
