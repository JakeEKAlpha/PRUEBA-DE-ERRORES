import { BrowserPool, type HttpRequestLike } from './BrowserPool.ts';
import {
  CONTROLLED_DOCX_SHELL_HTML,
  defaultLoadVendorScripts,
} from './docxShellHtml.ts';
import {
  assertValidPdfBuffer,
  type DocxToPdfConverter,
} from './libreOfficeConverter.ts';

export interface PuppeteerDocxConverterOptions {
  browserPool?: BrowserPool;
  loadVendorScripts?: () => { jszipScript: string; docxPreviewScript: string };
}

export interface RenderedDocxLayoutMetrics {
  sectionCount: number;
  height: number;
  hasLogo: boolean;
  hasTable: boolean;
  logoLeft: number;
  logoTop: number;
  logoBottom: number;
  titleTop: number;
  titleBottom: number;
  tableLeft: number;
  tableWidthRatio: number;
}

export class PuppeteerDocxConverter implements DocxToPdfConverter {
  public readonly version = 'puppeteer-docx-preview-v2';
  private readonly browserPool: BrowserPool;
  private readonly loadVendorScripts: () => { jszipScript: string; docxPreviewScript: string };

  constructor(options: PuppeteerDocxConverterOptions = {}) {
    this.browserPool = options.browserPool ?? BrowserPool.getInstance();
    this.loadVendorScripts = options.loadVendorScripts ?? defaultLoadVendorScripts;
  }

  private async renderDocxInPage<T>(
    docxBuffer: Buffer,
    onReady: (
      page: Parameters<Parameters<BrowserPool['withPage']>[0]>[0],
      metrics: RenderedDocxLayoutMetrics
    ) => Promise<T>
  ): Promise<T> {
    if (!Buffer.isBuffer(docxBuffer) || docxBuffer.subarray(0, 2).toString('utf8') !== 'PK') {
      throw new Error('Buffer .docx inválido para conversión a PDF.');
    }

    const { jszipScript, docxPreviewScript } = this.loadVendorScripts();

    return this.browserPool.withPage(async (page) => {
      if (typeof page.setRequestInterception === 'function' && typeof page.on === 'function') {
        await page.setRequestInterception(true);
        page.on('request', (req: HttpRequestLike) => {
          const url = req.url();
          if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) {
            void req.continue().catch(() => {});
          } else {
            void req.abort('blockedbyclient').catch(() => {});
          }
        });
      }

      await page.setContent(CONTROLLED_DOCX_SHELL_HTML, { waitUntil: 'domcontentloaded' });

      if (typeof page.addScriptTag !== 'function' || typeof page.evaluate !== 'function') {
        throw new Error('La instancia de página Puppeteer no soporta renderizado OOXML.');
      }

      await page.addScriptTag({ content: jszipScript });
      await page.addScriptTag({ content: docxPreviewScript });

      const metrics = await page.evaluate(async (docxBase64: string): Promise<RenderedDocxLayoutMetrics> => {
        const binaryStr = atob(docxBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i += 1) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const root = document.getElementById('docx-root');
        if (!root) {
          throw new Error('Contenedor OOXML no encontrado.');
        }

        const docxGlobal = (window as unknown as {
          docx?: {
            renderAsync: (
              data: ArrayBuffer,
              bodyContainer: HTMLElement,
              styleContainer: HTMLElement | null,
              options: Record<string, unknown>
            ) => Promise<void>;
          };
        }).docx;

        if (!docxGlobal || typeof docxGlobal.renderAsync !== 'function') {
          throw new Error('Motor docx-preview no inicializado.');
        }

        await docxGlobal.renderAsync(bytes.buffer, root, null, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });

        const images = Array.from(root.querySelectorAll('img'));
        await Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true });
                  img.addEventListener('error', () => resolve(), { once: true });
                })
          )
        );

        const sections = Array.from(root.querySelectorAll('section.docx'));
        const firstSection = sections[0];
        const sectionRect = firstSection ? firstSection.getBoundingClientRect() : null;
        const logoImg = firstSection?.querySelector('header img');
        const logoRect = logoImg ? logoImg.getBoundingClientRect() : null;
        const titleEl = firstSection?.querySelector('header p:nth-child(2)');
        const titleRect = titleEl ? titleEl.getBoundingClientRect() : null;
        const mainTable = firstSection?.querySelector('table');
        const tableRect = mainTable ? mainTable.getBoundingClientRect() : null;

        return {
          sectionCount: sections.length,
          height: firstSection ? firstSection.scrollHeight : 1056,
          hasLogo: Boolean(logoRect),
          hasTable: Boolean(tableRect),
          logoLeft: logoRect?.left ?? 0,
          logoTop: logoRect?.top ?? 0,
          logoBottom: logoRect?.bottom ?? 0,
          titleTop: titleRect?.top ?? 0,
          titleBottom: titleRect?.bottom ?? 0,
          tableLeft: tableRect?.left ?? 0,
          tableWidthRatio:
            sectionRect && sectionRect.width > 0 && tableRect
              ? tableRect.width / sectionRect.width
              : 0,
        };
      }, docxBuffer.toString('base64'));

      return onReady(page, metrics);
    });
  }

  public async inspectRenderedLayout(docxBuffer: Buffer): Promise<RenderedDocxLayoutMetrics> {
    return this.renderDocxInPage(docxBuffer, async (_page, metrics) => metrics);
  }

  public async convert(docxBuffer: Buffer): Promise<Buffer> {
    return this.renderDocxInPage(docxBuffer, async (page, metrics) => {
      const scale =
        metrics.sectionCount === 1 && metrics.height > 1056 && metrics.height <= 1350
          ? Math.max(0.75, Math.floor((1048 / metrics.height) * 1000) / 1000)
          : 1;

      const pdfBytes = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        scale,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      return assertValidPdfBuffer(Buffer.from(pdfBytes), 'Puppeteer OOXML');
    });
  }
}
