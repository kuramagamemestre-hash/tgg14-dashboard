// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Defina a variável de ambiente (Render) ou no seu .env local.'
  );
}

export default defineConfig({
  // Pasta onde o drizzle-kit salva artefatos/migrations
  // (pode ser "./migrations" se preferir — isso não afeta o `push`):
  out: './drizzle',

  // Caminho do seu schema do Drizzle
  // Se tiver vários arquivos, você pode usar um glob, ex: "./shared/**/*.schema.ts"
  schema: './shared/schema.ts',

  dialect: 'postgresql',
  dbCredentials: {
    url, // mesma URL do Neon que você configurou no Render (DATABASE_URL)
  },

  // Opcional, mas útil:
  // strict: true,
  // verbose: true,
});
