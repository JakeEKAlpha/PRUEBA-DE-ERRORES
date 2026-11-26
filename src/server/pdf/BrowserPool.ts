import puppeteerCore from 'puppeteer-core';
import {
  DEFAULT_PUPPETEER_ARGS,
  resolveChromiumExecutablePath,
  resolveChromiumLaunchArgs,
  type ResolveChromiumOptions,
} from './chromiumResolver.ts';

export {
  DEFAULT_PUPPETEER_ARGS,
  resolveChromiumExecutablePath,
  resolveChromiumLaunchArgs,
  type ResolveChromiumOptions,
};

export interface HttpRequestLike {
  url(): string;
  continue(): Promise<void>;
  abort(errorCode?: string): Promise<void>;
}

export interface PageLike {
  setContent(
    html: string,
    options?: { waitUntil?: 'domcontentloaded' | 'load' | 'networkidle0' | 'networkidle2' }
  ): Promise<void>;
  pdf(options?: {
    format?: 'A4' | 'Letter';
    printBackground?: boolean;
    preferCSSPageSize?: boolean;
    scale?: number;
    margin?: { top?: string; bottom?: string; left?: string; right?: string };
  }): Promise<Uint8Array | Buffer>;
  close(): Promise<void>;
  addScriptTag?(options: { content?: string; path?: string; url?: string }): Promise<unknown>;
  evaluate?<T, Args extends unknown[]>(
    fn: (...args: Args) => T | Promise<T>,
    ...args: Args
  ): Promise<T>;
  setRequestInterception?(value: boolean): Promise<void>;
  on?(event: string, handler: (...args: any[]) => void): unknown;
}

export interface BrowserLike {
  isConnected(): boolean;
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
  on(event: 'disconnected', listener: () => void): unknown;
}

export interface SignalTarget {
  on(event: 'SIGTERM' | 'SIGINT', listener: () => void): unknown;
  off?(event: 'SIGTERM' | 'SIGINT', listener: () => void): unknown;
  removeListener?(event: 'SIGTERM' | 'SIGINT', listener: () => void): unknown;
}

export interface BrowserPoolOptions {
  launchBrowser?: () => Promise<BrowserLike>;
  signalTarget?: SignalTarget | null;
}

async function defaultLaunchBrowser(): Promise<BrowserLike> {
  const executablePath = await resolveChromiumExecutablePath();
  const launchArgs = await resolveChromiumLaunchArgs();
  const browser = await puppeteerCore.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: launchArgs,
  });
  return browser as unknown as BrowserLike;
}

export class BrowserPool {
  private static instance: BrowserPool | null = null;

  private readonly launchBrowser: () => Promise<BrowserLike>;
  private readonly signalTarget: SignalTarget | null;
  private browser: BrowserLike | null = null;
  private launchPromise: Promise<BrowserLike> | null = null;
  private closePromise: Promise<void> | null = null;
  private readonly onShutdownSignal: () => void;
  private signalsRegistered = false;

  constructor(options: BrowserPoolOptions = {}) {
    this.launchBrowser = options.launchBrowser ?? defaultLaunchBrowser;
    this.signalTarget = options.signalTarget === undefined ? process : options.signalTarget;
    this.onShutdownSignal = () => {
      void this.close();
    };

    if (this.signalTarget) {
      this.registerSignalHandlers(this.signalTarget);
    }
  }

  public static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  public registerSignalHandlers(target: SignalTarget): void {
    if (this.signalsRegistered) return;
    target.on('SIGTERM', this.onShutdownSignal);
    target.on('SIGINT', this.onShutdownSignal);
    this.signalsRegistered = true;
  }

  public unregisterSignalHandlers(): void {
    if (!this.signalsRegistered || !this.signalTarget) return;
    if (typeof this.signalTarget.off === 'function') {
      this.signalTarget.off('SIGTERM', this.onShutdownSignal);
      this.signalTarget.off('SIGINT', this.onShutdownSignal);
    } else if (typeof this.signalTarget.removeListener === 'function') {
      this.signalTarget.removeListener('SIGTERM', this.onShutdownSignal);
      this.signalTarget.removeListener('SIGINT', this.onShutdownSignal);
    }
    this.signalsRegistered = false;
  }

  public async getBrowser(): Promise<BrowserLike> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.launchPromise) {
      return this.launchPromise;
    }

    this.browser = null;
    this.launchPromise = this.launchBrowser()
      .then((launched) => {
        this.browser = launched;
        launched.on('disconnected', () => {
          if (this.browser === launched) {
            this.browser = null;
          }
        });
        return launched;
      })
      .finally(() => {
        this.launchPromise = null;
      });

    return this.launchPromise;
  }

  public async withPage<T>(fn: (page: PageLike) => Promise<T>): Promise<T> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      return await fn(page);
    } finally {
      await page.close().catch(() => {});
    }
  }

  public async compileHtmlToPdf(html: string): Promise<Buffer> {
    return this.withPage(async (page) => {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
      });
      return Buffer.from(pdfBytes);
    });
  }

  public async close(): Promise<void> {
    if (this.closePromise) {
      return this.closePromise;
    }

    this.closePromise = (async () => {
      if (this.launchPromise) {
        try {
          await this.launchPromise;
        } catch {
          // Ignore launch failure during shutdown
        }
      }

      const active = this.browser;
      this.browser = null;
      if (active) {
        await active.close().catch(() => {});
      }
    })().finally(() => {
      this.closePromise = null;
    });

    return this.closePromise;
  }
}
