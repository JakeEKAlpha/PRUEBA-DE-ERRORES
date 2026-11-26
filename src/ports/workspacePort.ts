import type { OfficialEngineer, ServiceRecord, VisitRecord } from '../types/index.ts';

export interface PickedFileRecord {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

export interface DriveFilePickerPort {
  openPicker(
    accessToken: string,
    onFilePicked: (file: PickedFileRecord) => void
  ): Promise<void>;
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: number;
}

export interface WorkspaceMailPort {
  sendAccessEmail(
    accessToken: string,
    service: ServiceRecord,
    visit: VisitRecord,
    engineer?: OfficialEngineer,
    recipientEmail?: string
  ): Promise<GmailSendResult>;
}
