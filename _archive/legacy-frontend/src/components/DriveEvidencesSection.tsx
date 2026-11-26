import React from 'react';
import type { DriveEvidenceRecord } from '../types';

interface DriveEvidencesSectionProps {
  evidences: DriveEvidenceRecord[];
  readOnly: boolean;
  onAttachFromDrive?: () => void;
  onUnlinkEvidence?: (evidenceId: string) => void;
}

export const DriveEvidencesSection: React.FC<DriveEvidencesSectionProps> = ({
  evidences,
  readOnly,
  onAttachFromDrive,
  onUnlinkEvidence,
}) => {
  return (
    <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-amber-500">folder_open</span>
          <span>Evidencias en Google Drive ({evidences.length})</span>
        </h4>
        {!readOnly && onAttachFromDrive && (
          <button
            type="button"
            onClick={onAttachFromDrive}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40 hover:bg-amber-500/25 font-bold text-[11px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add_to_drive</span>
            <span>Adjuntar de Drive</span>
          </button>
        )}
      </div>

      {evidences.length === 0 ? (
        <p className="text-neutral-400 text-[11px]">
          No hay archivos de evidencia vinculados a este servicio.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {evidences.map((ev) => (
            <li key={ev.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#0D734D] dark:text-[#5ce28a] hover:underline flex items-center gap-1.5 truncate"
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">attach_file</span>
                  <span className="truncate">{ev.name}</span>
                  <span className="material-symbols-outlined text-[13px] shrink-0">open_in_new</span>
                </a>
                <span className="text-[11px] text-neutral-400 font-mono block">
                  {ev.mimeType} · {ev.attachedBy}
                </span>
              </div>

              {!readOnly && onUnlinkEvidence && (
                <button
                  type="button"
                  onClick={() => onUnlinkEvidence(ev.id)}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0 cursor-pointer"
                >
                  Desvincular
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
