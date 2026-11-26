import fs from 'node:fs';
import path from 'node:path';

export interface ClosableHttpServer {
  close: (callback: (err?: Error) => void) => void;
  closeIdleConnections?: () => void;
}

export interface GracefulShutdownOptions {
  httpServer: ClosableHttpServer;
  closeBrowserPool: () => Promise<void>;
  closeDbPool: () => Promise<void>;
  timeoutMs?: number;
  exit?: (code: number) => void;
  logger?: (message: string) => void;
}

export function resolveStaticDistDir(
  baseDir: string,
  cwd: string = process.cwd()
): string {
  const localDist = path.join(baseDir, 'dist');
  if (fs.existsSync(path.join(localDist, 'index.html'))) {
    return localDist;
  }

  const parentDist = path.resolve(baseDir, '..', 'dist');
  if (fs.existsSync(path.join(parentDist, 'index.html'))) {
    return parentDist;
  }

  return path.resolve(cwd, 'dist');
}

function closeHttpServerAsync(
  httpServer: ClosableHttpServer
): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer.closeIdleConnections?.();
    httpServer.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function createGracefulShutdown(
  options: GracefulShutdownOptions
): (signal?: string) => Promise<void> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const exit = options.exit ?? ((code: number) => process.exit(code));
  const log = options.logger ?? ((msg: string) => console.log(msg));

  let shutdownPromise: Promise<void> | null = null;

  return (signal = 'SIGTERM'): Promise<void> => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      log(`[Lifecycle] Received ${signal}. Starting graceful shutdown...`);
      let exitCode = 0;

      const forceTimer = setTimeout(() => {
        log('[Lifecycle] Shutdown timed out; forcing exit.');
        exit(1);
      }, timeoutMs);
      forceTimer.unref?.();

      try {
        await closeHttpServerAsync(options.httpServer);
      } catch (err) {
        exitCode = 1;
        log(
          `[Lifecycle] Error closing HTTP server: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }

      const resourceResults = await Promise.allSettled([
        options.closeBrowserPool(),
        options.closeDbPool(),
      ]);

      for (const result of resourceResults) {
        if (result.status === 'rejected') {
          exitCode = 1;
          const msg =
            result.reason instanceof Error ? result.reason.message : 'Unknown cleanup error';
          log(`[Lifecycle] Resource cleanup error: ${msg}`);
        }
      }

      clearTimeout(forceTimer);
      exit(exitCode);
    })();

    return shutdownPromise;
  };
}
