import { describe, expect, it } from 'vitest';
import { escapeCell, toCsv } from './csv.js';

describe('escapeCell', () => {
  it.each([
    '=1+1',
    '+SUM(A1)',
    '-2+3',
    '@cmd',
    '\tcmd',
    '\rcmd',
    '  =HYPERLINK("x")',
  ])('neutralises formula starter %j', (input) => {
    const out = escapeCell(input);
    expect(out.replace(/^"/, '').startsWith("'")).toBe(true);
  });

  it('quotes cells with commas, quotes and newlines', () => {
    expect(escapeCell('a,b')).toBe('"a,b"');
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCell('l1\nl2')).toBe('"l1\nl2"');
  });

  it('escapes formulas and quotes together', () => {
    expect(escapeCell('=A1,"x"')).toBe(`"'=A1,""x"""`);
  });

  it('leaves ordinary values and typed numbers alone', () => {
    expect(escapeCell('Jane Doe')).toBe('Jane Doe');
    expect(escapeCell('a=b')).toBe('a=b');
    expect(escapeCell(-5)).toBe('-5');
    expect(escapeCell(null)).toBe('');
    expect(escapeCell(true)).toBe('true');
    expect(escapeCell(new Date('2026-01-01T00:00:00Z'))).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });
});

describe('toCsv', () => {
  it('writes a BOM, header and CRLF rows', () => {
    expect(toCsv(['a', 'b'], [[1, '=x']])).toBe("﻿a,b\r\n1,'=x\r\n");
  });
});
