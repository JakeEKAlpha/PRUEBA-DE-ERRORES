import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface DocxToPdfConverter {
  readonly version: string;
  convert(docxBuffer: Buffer): Promise<Buffer>;
}

export interface AvailabilityDocxToPdfConverter extends DocxToPdfConverter {
  isAvailable(): Promise<boolean>;
}

export function assertValidPdfBuffer(buffer: Buffer, sourceLabel = 'DOCX->PDF'): Buffer {
  if (!Buffer.isBuffer(buffer) || buffer.subarray(0, 5).toString('utf8') !== '%PDF-') {
    throw new Error(`${sourceLabel} no produjo un binario %PDF- válido.`);
  }
  return buffer;
}

export type CommandRunner = (
  cmd: string,
  args: string[],
  options?: { timeout?: number }
) => Promise<{ stdout: string; stderr: string }>;

const defaultCommandRunner: CommandRunner = async (cmd, args, options) => {
  const result = await execFileAsync(cmd, args, {
    timeout: options?.timeout ?? 30_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    stdout: String(result.stdout ?? ''),
    stderr: String(result.stderr ?? ''),
  };
};

export interface LibreOfficeDocxConverterOptions {
  binaries?: string[];
  commandRunner?: CommandRunner;
  timeoutMs?: number;
}

export class LibreOfficeDocxConverter implements AvailabilityDocxToPdfConverter {
  public readonly version = 'libreoffice-soffice-v1';
  private readonly binaries: string[];
  private readonly commandRunner: CommandRunner;
  private readonly timeoutMs: number;
  private detectedBinary: string | null | undefined = undefined;

  constructor(options: LibreOfficeDocxConverterOptions = {}) {
    this.binaries = options.binaries ?? ['soffice', 'libreoffice'];
    this.commandRunner = options.commandRunner ?? defaultCommandRunner;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  public async isAvailable(): Promise<boolean> {
    return (await this.resolveBinary()) !== null;
  }

  private async resolveBinary(): Promise<string | null> {
    if (this.detectedBinary !== undefined) {
      return this.detectedBinary;
    }

    for (const bin of this.binaries) {
      try {
        await this.commandRunner(bin, ['--version'], { timeout: 5_000 });
        this.detectedBinary = bin;
        return bin;
      } catch {
        // Try next candidate
      }
    }

    this.detectedBinary = null;
    return null;
  }

  public async convert(docxBuffer: Buffer): Promise<Buffer> {
    const binary = await this.resolveBinary();
    if (!binary) {
      throw new Error('LibreOffice headless (soffice) no está disponible en el host.');
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexmark-docx-'));
    const inputPath = path.join(tempDir, 'document.docx');
    const outputPath = path.join(tempDir, 'document.pdf');
    const userProfileDir = path.join(tempDir, 'lo-profile');

    try {
      await fs.writeFile(inputPath, docxBuffer);
      await this.commandRunner(
        binary,
        [
          '--headless',
          '--nologo',
          '--nodefault',
          '--nofirststartwizard',
          `-env:UserInstallation=file://${userProfileDir}`,
          '--convert-to',
          'pdf',
          '--outdir',
          tempDir,
          inputPath,
        ],
        { timeout: this.timeoutMs }
      );

      const pdfBuffer = await fs.readFile(outputPath);
      return assertValidPdfBuffer(pdfBuffer, 'LibreOffice');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
