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
    <div className="bg-neutral-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 text-base">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <h4 className="text-h4 font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500">folder_open</span>
          <span>Evidencias en Google Drive (<span className="font-data tabular-nums">{evidences.length}</span>)</span>
        </h4>
        {!readOnly && onAttachFromDrive && (
          <button
            type="button"
            onClick={onAttachFromDrive}
            className="hit-target flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-[#8a6808] dark:text-[#f7d66d] border border-amber-400/40 hover:bg-amber-500/25 font-bold text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_to_drive</span>
            <span>Adjuntar de Drive</span>
          </button>
        )}
      </div>

      {evidences.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
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
                  className="text-base font-semibold text-[#1b6b37] dark:text-[#5ce28a] hover:underline flex items-center gap-1.5 truncate"
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">attach_file</span>
                  <span className="truncate">{ev.name}</span>
                  <span className="material-symbols-outlined text-[15px] shrink-0">open_in_new</span>
                </a>
                <span className="text-sm text-neutral-500 dark:text-neutral-400 font-data block truncate">
                  {ev.mimeType} · {ev.attachedBy}
                </span>
              </div>

              {!readOnly && onUnlinkEvidence && (
                <button
                  type="button"
                  onClick={() => onUnlinkEvidence(ev.id)}
                  className="hit-target px-2.5 py-1.5 rounded-lg text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-[background-color,transform] duration-150 active:scale-[0.96] shrink-0 cursor-pointer"
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
