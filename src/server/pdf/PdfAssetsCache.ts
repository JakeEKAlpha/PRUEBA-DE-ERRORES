import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type LogoVariant = 'light' | 'dark';

export interface PdfAssetsCacheOptions {
  templatePath?: string;
  lightLogoPath?: string;
  darkLogoPath?: string;
  rendererVersion?: string;
  readFileSync?: (filePath: string) => Buffer;
  existsSync?: (filePath: string) => boolean;
}

const DEFAULT_RENDERER_VERSION = 'docx-to-pdf-v1';

export class PdfAssetsCache {
  private static defaultInstance: PdfAssetsCache | null = null;

  private readonly templatePath: string;
  private readonly lightLogoPath: string;
  private readonly darkLogoPath: string;
  private readonly rendererVersion: string;
  private readonly readFileFn: (filePath: string) => Buffer;
  private readonly existsFn: (filePath: string) => boolean;

  private docxTemplateBuffer: Buffer | null = null;
  private readonly logos = new Map<LogoVariant, string>();
  private templateVersionCache: string | null = null;

  constructor(options: PdfAssetsCacheOptions = {}) {
    this.templatePath =
      options.templatePath ??
      path.resolve(process.cwd(), 'public', 'Orden_Servicio_Tecnico_Plantilla (3).docx');
    this.lightLogoPath =
      options.lightLogoPath ??
      path.resolve(process.cwd(), 'public/assets/aistudio/LOGO_CLARO_SIN_FONDO_486b43d6.png');
    this.darkLogoPath =
      options.darkLogoPath ??
      path.resolve(process.cwd(), 'public/assets/aistudio/LOGO_FONDO_OSCURO_b37fcf75.png');
    this.rendererVersion = options.rendererVersion ?? DEFAULT_RENDERER_VERSION;
    this.readFileFn = options.readFileSync ?? ((p: string) => fs.readFileSync(p));
    this.existsFn = options.existsSync ?? ((p: string) => fs.existsSync(p));
  }

  public static getDefault(): PdfAssetsCache {
    if (!PdfAssetsCache.defaultInstance) {
      PdfAssetsCache.defaultInstance = new PdfAssetsCache();
    }
    return PdfAssetsCache.defaultInstance;
  }

  public preload(): void {
    this.loadDocxTemplateIfPresent();
    this.getLogoDataUri('light');
    this.getLogoDataUri('dark');
    this.getTemplateVersion();
  }

  public getDocxTemplateBuffer(): Buffer {
    if (this.docxTemplateBuffer) {
      return this.docxTemplateBuffer;
    }
    if (!this.existsFn(this.templatePath)) {
      throw new Error('La plantilla oficial .docx no está disponible en el servidor.');
    }
    this.docxTemplateBuffer = this.readFileFn(this.templatePath);
    return this.docxTemplateBuffer;
  }

  public getLogoDataUri(variant: LogoVariant = 'light'): string {
    const cached = this.logos.get(variant);
    if (cached !== undefined) {
      return cached;
    }

    const logoPath = variant === 'dark' ? this.darkLogoPath : this.lightLogoPath;
    if (!this.existsFn(logoPath)) {
      this.logos.set(variant, '');
      return '';
    }

    const base64 = this.readFileFn(logoPath).toString('base64');
    const dataUri = `data:image/png;base64,${base64}`;
    this.logos.set(variant, dataUri);
    return dataUri;
  }

  public getTemplateVersion(): string {
    if (this.templateVersionCache) {
      return this.templateVersionCache;
    }

    const hash = crypto.createHash('sha256');
    hash.update(this.rendererVersion);
    const tpl = this.loadDocxTemplateIfPresent();
    if (tpl) {
      hash.update(tpl);
    }
    hash.update(this.getLogoDataUri('light'));
    this.templateVersionCache = hash.digest('hex').slice(0, 16);
    return this.templateVersionCache;
  }

  public clear(): void {
    this.docxTemplateBuffer = null;
    this.logos.clear();
    this.templateVersionCache = null;
  }

  private loadDocxTemplateIfPresent(): Buffer | null {
    if (this.docxTemplateBuffer) {
      return this.docxTemplateBuffer;
    }
    if (!this.existsFn(this.templatePath)) {
      return null;
    }
    this.docxTemplateBuffer = this.readFileFn(this.templatePath);
    return this.docxTemplateBuffer;
  }
}
