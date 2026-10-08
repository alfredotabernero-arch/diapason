// Exportación a CSV compatible con Excel en español (separador «;» y BOM UTF-8)
import { downloadBlob } from './backup.js';

export function toCSV(headers, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
}

export function downloadCSV(name, headers, rows) {
  const blob = new Blob(['﻿' + toCSV(headers, rows)], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, name.endsWith('.csv') ? name : `${name}.csv`);
}
