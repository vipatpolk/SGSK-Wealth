export {
  escapeCsvCell,
  filterTransactionsForExport,
  formatDateYMD,
  generateExportFilename,
  generateTransactionsCsv,
} from '../../../packages/domain/src/csv-exporter.utils';
export type { ExportCsvOptions } from '../../../packages/domain/src/csv-exporter.utils';

/**
 * Triggers browser file download of CSV content using Blob and ObjectURL.
 */
export function triggerFileDownload(csvContent: string, filename: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
