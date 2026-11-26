import { BrowserPool } from './BrowserPool.ts';
import {
  assertValidPdfBuffer,
  LibreOfficeDocxConverter,
  type AvailabilityDocxToPdfConverter,
  type CommandRunner,
  type DocxToPdfConverter,
  type LibreOfficeDocxConverterOptions,
} from './libreOfficeConverter.ts';
import {
  PuppeteerDocxConverter,
  type PuppeteerDocxConverterOptions,
  type RenderedDocxLayoutMetrics,
} from './puppeteerDocxConverter.ts';

export {
  assertValidPdfBuffer,
  LibreOfficeDocxConverter,
  PuppeteerDocxConverter,
  type AvailabilityDocxToPdfConverter,
  type CommandRunner,
  type DocxToPdfConverter,
  type LibreOfficeDocxConverterOptions,
  type PuppeteerDocxConverterOptions,
  type RenderedDocxLayoutMetrics,
};

export interface StrategyDocxToPdfConverterOptions {
  browserPool?: BrowserPool;
  libreOffice?: AvailabilityDocxToPdfConverter;
  puppeteer?: DocxToPdfConverter;
}

export class StrategyDocxToPdfConverter implements DocxToPdfConverter {
  private readonly libreOffice: AvailabilityDocxToPdfConverter;
  private readonly puppeteer: DocxToPdfConverter;

  constructor(options: StrategyDocxToPdfConverterOptions = {}) {
    this.libreOffice = options.libreOffice ?? new LibreOfficeDocxConverter();
    this.puppeteer =
      options.puppeteer ?? new PuppeteerDocxConverter({ browserPool: options.browserPool });
  }

  public get version(): string {
    return `strategy:${this.libreOffice.version}|${this.puppeteer.version}`;
  }

  public async convert(docxBuffer: Buffer): Promise<Buffer> {
    if (await this.libreOffice.isAvailable()) {
      try {
        return await this.libreOffice.convert(docxBuffer);
      } catch (err) {
        console.warn('LibreOffice DOCX->PDF conversion failed, falling back to Puppeteer OOXML:', err);
      }
    }

    return this.puppeteer.convert(docxBuffer);
  }
}
