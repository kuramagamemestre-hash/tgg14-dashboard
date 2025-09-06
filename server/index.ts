// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";

// ⬇️ NOVO: rota de login (usa bcrypt.compare)
import loginRouter from "./login";

// __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// healthcheck simples (ajuda no debug)
app.get("/health", (_req, res) => res.send("ok"));

// Ambiente
const isProd =
  app.get("env") === "production" || process.env.NODE_ENV === "production";

// Base de arquivos (em dev usamos o projeto, em prod usamos a pasta do build)
const baseDir = isProd ? __dirname : process.cwd();

/**
 * Servir arquivos estáticos da pasta attached_assets
 * - Em dev: process.cwd()/attached_assets
 * - Em prod: dist/server/attached_assets (ou como você copiou no build)
 */
app.use(
  "/attached_assets",
  express.static(path.join(baseDir, "attached_assets"))
);

/**
 * Logger básico para respostas JSON das rotas /api
 */
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = (bodyJson: any, ...args: any[]) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  // ⬇️ registra demais rotas da API que você já tem
  const server = await registerRoutes(app);

  // ⬇️ NOVO: registra a rota de login (/api/login)
  app.use(loginRouter);

  // Error handler (depois de registrar as rotas)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // rethrow para aparecer no log do Render
    throw err;
  });

  /**
   * Em desenvolvimento: usa Vite (HMR, etc.).
   * Em produção: serve a build estática do Vite e faz fallback para index.html nas rotas SPA.
   */
  if (!isProd) {
    await setupVite(app, server);
  } else {
    // Tenta os 2 caminhos possíveis do Vite:
    // A) dist/server/public (quando o server é bundlado em dist/server)
    // B) dist/public        (quando só o front foi para dist/public)
    const candidateA = path.join(__dirname, "public"); // dist/server/public
    const candidateB = path.join(__dirname, "..", "public"); // dist/public

    let publicDir = "";
    if (fs.existsSync(candidateA)) {
      publicDir = candidateA;
    } else if (fs.existsSync(candidateB)) {
      publicDir = candidateB;
    } else {
      const msg = `Could not find the build directory for the client app.
Tried:
  - ${candidateA}
  - ${candidateB}

Make sure your client build ran (e.g. "vite build") before starting the server.`;
      throw new Error(msg);
    }

    // Serve arquivos estáticos do front
    app.use(express.static(publicDir));

    // Fallback SPA: qualquer rota que não seja /api retorna index.html
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  // Porta obrigatória na Render
  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
