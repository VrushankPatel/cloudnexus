import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import path from 'path';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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

  // WebSocket server on port 5050 for real-time file change notifications
  const wss = new WebSocketServer({ port: 5050 });
  function broadcastFilesChanged() {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'filesChanged' }));
      }
    });
  }
  // Watch uploads directory for changes
  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  chokidar.watch(uploadsDir, { ignoreInitial: true })
    .on('add', broadcastFilesChanged)
    .on('unlink', broadcastFilesChanged)
    .on('change', broadcastFilesChanged)
    .on('addDir', broadcastFilesChanged)
    .on('unlinkDir', broadcastFilesChanged);
  console.log('WebSocket server running on ws://localhost:5050');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
})().catch(console.error);
