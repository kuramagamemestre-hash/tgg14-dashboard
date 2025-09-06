import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite"; // serveStatic não é mais necessário aqui
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ambiente
const isProd = app.get("env") === "production" || process.env.NODE_ENV === "production";
// Base de arquivos (em dev usamos o projeto, em prod usamos a pasta do build)
const baseDir = isProd ? __dirname : process.cwd();

/**
 * Servir arquivos estáticos da pasta attached_assets
 * - Em dev: process.cwd()/attached_assets
 * - Em prod: dist/server/attached_assets (copiados no build, se necessário)
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

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  /**
   * Em desenvolvimento: usa Vite (HMR, etc.).
   * Em produção: serve a build estática do Vite (dist/server/public) e
   *              faz fallback para index.html para rotas SPA.
   */
  if (!isProd) {
    await setupVite(app, server);
  } else {
    // Arquivos estáticos gerados pelo Vite: dist/server/public
    const publicDir = path.join(__dirname, "public");
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
