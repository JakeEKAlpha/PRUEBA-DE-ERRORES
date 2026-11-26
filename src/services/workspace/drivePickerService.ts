/**
 * DrivePickerService
 * SOLID - Single Responsibility: Google Picker and Google Drive integration for service evidences and documents.
 */
declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface PickedFileRecord {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

export class DrivePickerService {
  private static readonly GAPI_LOAD_TIMEOUT_MS = 10_000;
  private static gapiLoadPromise: Promise<void> | null = null;
  private static isGapiLoaded = false;

  /**
   * Loads Google API Client (gapi) script via shared singleton promise with 10s timeout
   */
  public static loadGapiScript(timeoutMs = this.GAPI_LOAD_TIMEOUT_MS): Promise<void> {
    if (this.isGapiLoaded && window.gapi) {
      return Promise.resolve();
    }

    if (this.gapiLoadPromise) {
      return this.gapiLoadPromise;
    }

    this.gapiLoadPromise = new Promise<void>((resolve, reject) => {
      let settled = false;
      const finishError = (err: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        this.gapiLoadPromise = null;
        reject(err);
      };

      const timeoutId = setTimeout(() => {
        finishError(new Error('Tiempo de espera agotado al cargar el selector de Google Drive.'));
      }, timeoutMs);

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!window.gapi?.load) {
          finishError(new Error('No se pudo inicializar el cliente de Google Drive.'));
          return;
        }
        window.gapi.load('picker', () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          this.isGapiLoaded = true;
          this.gapiLoadPromise = null;
          resolve();
        });
      };
      script.onerror = (err) => {
        finishError(err instanceof Error ? err : new Error('Error al cargar el script de Google Drive.'));
      };
      document.body.appendChild(script);
    });

    return this.gapiLoadPromise;
  }

  /**
   * Opens Google Picker modal with the in-memory access token
   */
  public static async openPicker(
    accessToken: string,
    onFilePicked: (file: PickedFileRecord) => void
  ): Promise<void> {
    if (!accessToken) {
      throw new Error('No fue posible inicializar el selector de Drive. Renueve la sesión de Google Workspace.');
    }

    await this.loadGapiScript();

    if (!window.google || !window.google.picker) {
      throw new Error('No se pudo cargar el selector de Google Drive.');
    }

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    view.setIncludeFolders(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .addView(new window.google.picker.DocsUploadView())
      .setOAuthToken(accessToken)
      .setOrigin(pickerOrigin)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED && data.docs && data.docs.length > 0) {
          const doc = data.docs[0];
          onFilePicked({
            id: doc.id,
            name: doc.name,
            url: doc.url,
            mimeType: doc.mimeType,
          });
        }
      })
      .build();

    picker.setVisible(true);
  }
}
