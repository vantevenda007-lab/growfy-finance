export function downloadCSV(filename: string, rows: Record<string, string | number>[]): void {
  if (rows.length === 0) {
    window.alert('Nada para exportar.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number): string => {
    const str = String(value ?? '');
    if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const csv = [
    headers.join(';'),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(';')),
  ].join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
