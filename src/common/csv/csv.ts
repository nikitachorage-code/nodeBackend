/**
 * Escapes one CSV cell. Strings that a spreadsheet could read as a formula
 * (starting with = + - @ tab or CR, ignoring leading spaces) are prefixed with
 * a single quote so they stay text. Typed numbers are written as-is.
 */
export function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  let s = typeof value === 'string' ? value : JSON.stringify(value);
  if (/^ *[=+\-@]/.test(s) || /^[\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds a CSV document (CRLF line ends, UTF-8 BOM so Excel detects the encoding). */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(escapeCell).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}
