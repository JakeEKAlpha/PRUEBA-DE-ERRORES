import React from 'react';
import type { RawFieldRow } from '../../hooks/useRawBackup';

interface RawBackupTableProps {
  rows: RawFieldRow[];
  searchTerm: string;
  copiedKey: string | null;
  onCopyValue: (key: string, value: string) => Promise<void>;
}

export const RawBackupTable: React.FC<RawBackupTableProps> = ({
  rows,
  searchTerm,
  copiedKey,
  onCopyValue,
}) => {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="bg-neutral-100 dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 font-bold uppercase text-sm">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 w-1/3">Columna Portal</th>
              <th className="py-2.5 px-3">Valor Original</th>
              <th className="py-2.5 px-3 w-24 text-right">Copiar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-base text-neutral-600 dark:text-neutral-400">
                  No se encontraron campos que coincidan con &quot;{searchTerm}&quot;.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isCopied = copiedKey === row.key;
                return (
                  <tr key={row.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-2 px-3 text-center font-data tabular-nums text-sm text-neutral-600 dark:text-neutral-400">
                      {row.index}
                    </td>
                    <td className="py-2 px-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200 break-words">
                      {row.key}
                    </td>
                    <td className="py-2 px-3 font-data text-sm text-neutral-800 dark:text-neutral-200 break-all">
                      {row.value ? row.value : <span className="text-neutral-500 dark:text-neutral-400">—</span>}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={!row.value}
                        onClick={() => void onCopyValue(row.key, row.value)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 text-neutral-700 dark:text-neutral-200 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {isCopied ? 'check' : 'content_copy'}
                        </span>
                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
