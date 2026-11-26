import fsSync from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let cachedVendorScripts: { jszipScript: string; docxPreviewScript: string } | null = null;

function resolveExistingPath(candidates: string[], label: string): string {
  for (const candidate of candidates) {
    if (fsSync.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`No se encontró el script local requerido: ${label}`);
}

export function defaultLoadVendorScripts(): { jszipScript: string; docxPreviewScript: string } {
  if (cachedVendorScripts) {
    return cachedVendorScripts;
  }

  const jszipEntryDir = path.dirname(require.resolve('jszip'));
  const docxPreviewEntryDir = path.dirname(require.resolve('docx-preview'));

  const jszipPath = resolveExistingPath(
    [
      path.join(jszipEntryDir, 'jszip.min.js'),
      path.resolve(jszipEntryDir, '..', 'dist', 'jszip.min.js'),
      path.resolve(process.cwd(), 'node_modules/jszip/dist/jszip.min.js'),
    ],
    'jszip.min.js'
  );
  const docxPreviewPath = resolveExistingPath(
    [
      path.join(docxPreviewEntryDir, 'docx-preview.min.js'),
      path.resolve(docxPreviewEntryDir, '..', 'dist', 'docx-preview.min.js'),
      path.resolve(process.cwd(), 'node_modules/docx-preview/dist/docx-preview.min.js'),
    ],
    'docx-preview.min.js'
  );

  cachedVendorScripts = {
    jszipScript: fsSync.readFileSync(jszipPath, 'utf8'),
    docxPreviewScript: fsSync.readFileSync(docxPreviewPath, 'utf8'),
  };
  return cachedVendorScripts;
}

export const CONTROLLED_DOCX_SHELL_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:;" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .docx-wrapper {
      background: transparent !important;
      padding: 0 !important;
      display: block !important;
    }
    .docx-wrapper > section.docx {
      box-shadow: none !important;
      margin: 0 !important;
      width: 100% !important;
      padding: 26pt 36pt 20pt 36pt !important;
      box-sizing: border-box !important;
    }
    .docx-wrapper > section.docx header {
      position: relative !important;
      margin-top: 0 !important;
      margin-bottom: 6pt !important;
      min-height: 32pt !important;
      display: flex !important;
      align-items: flex-end !important;
      justify-content: center !important;
    }
    .docx-wrapper > section.docx header p:first-child {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      text-align: left !important;
      line-height: 1 !important;
    }
    .docx-wrapper > section.docx header p:first-child div {
      width: auto !important;
      height: auto !important;
      position: static !important;
    }
    .docx-wrapper > section.docx header p:first-child img {
      position: static !important;
      display: block !important;
      width: 168pt !important;
      height: auto !important;
    }
    .docx-wrapper > section.docx header p:nth-child(2) {
      margin: 0 !important;
      padding-bottom: 1pt !important;
      text-align: center !important;
    }
    .docx-wrapper > section.docx article > p:first-child {
      margin: 0 !important;
      line-height: 0 !important;
    }
    .docx-wrapper > section.docx table {
      width: 100% !important;
    }
    @media print {
      @page {
        size: 612pt 792pt;
        margin: 0;
      }
      .docx-wrapper {
        background: transparent !important;
        padding: 0 !important;
      }
      .docx-wrapper > section.docx {
        box-shadow: none !important;
        margin: 0 !important;
        width: 100% !important;
        padding: 26pt 36pt 20pt 36pt !important;
        box-sizing: border-box !important;
        page-break-after: always;
      }
      .docx-wrapper > section.docx:last-child {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div id="docx-root"></div>
</body>
</html>`;
