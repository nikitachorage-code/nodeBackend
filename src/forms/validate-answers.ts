import type { FieldType } from '../generated/prisma/enums.js';
import { badRequest } from '../common/errors/api-exception.js';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: unknown;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidateOptions {
  /** true: every required field must be present (e.g. creating a certification). */
  requireAll: boolean;
  /** Keys that exist but cannot be written by the client. */
  readOnlyKeys?: ReadonlySet<string>;
  /** When false, null cannot clear a required field. */
  allowClearRequired?: boolean;
  /** Checks that a file id exists and may be used by the caller. */
  fileUsable?: (fileId: string) => Promise<boolean>;
  /** Prefix for issue field names, e.g. the step key. */
  prefix?: string;
}

export interface ValidateResult {
  /** Normalised values. null means "clear this value". */
  values: Record<string, string | number | boolean | null>;
  issues: ValidationIssue[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isRealDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, da));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === da
  );
}

export function dropdownOptions(options: unknown): string[] {
  return Array.isArray(options)
    ? options.filter((o): o is string => typeof o === 'string')
    : [];
}

/** True when a stored value counts as "filled in". */
export function isFilled(type: FieldType, value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (type === 'CHECKBOX') return value === true;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

async function checkValue(
  def: FieldDef,
  raw: unknown,
  opts: ValidateOptions,
): Promise<{ value?: string | number | boolean; error?: string }> {
  switch (def.type) {
    case 'TEXT':
    case 'LONG_TEXT': {
      if (typeof raw !== 'string') return { error: 'Must be a string' };
      const v = raw.trim();
      const max = def.type === 'TEXT' ? 255 : 5000;
      if (v.length > max) return { error: `Must be at most ${max} characters` };
      return { value: v };
    }
    case 'NUMBER':
      return typeof raw === 'number' && Number.isFinite(raw)
        ? { value: raw }
        : { error: 'Must be a number' };
    case 'DATE':
      return typeof raw === 'string' && isRealDate(raw)
        ? { value: raw }
        : { error: 'Must be a valid date in YYYY-MM-DD format' };
    case 'DROPDOWN': {
      const options = dropdownOptions(def.options);
      return typeof raw === 'string' && options.includes(raw)
        ? { value: raw }
        : { error: `Must be one of: ${options.join(', ')}` };
    }
    case 'CHECKBOX':
      return typeof raw === 'boolean'
        ? { value: raw }
        : { error: 'Must be true or false' };
    case 'FILE': {
      if (typeof raw !== 'string' || !UUID_RE.test(raw)) {
        return { error: 'Must be a file id returned by the upload endpoint' };
      }
      if (opts.fileUsable && !(await opts.fileUsable(raw))) {
        return { error: 'File not found' };
      }
      return { value: raw };
    }
  }
}

/**
 * Validates client input against the admin-configured field definitions.
 * Unknown and read-only keys are rejected; types, dropdown options and
 * required rules follow the definitions.
 */
export async function validateAnswers(
  fields: FieldDef[],
  input: Record<string, unknown>,
  opts: ValidateOptions,
): Promise<ValidateResult> {
  const issues: ValidationIssue[] = [];
  const values: ValidateResult['values'] = {};
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const name = (key: string) => (opts.prefix ? `${opts.prefix}.${key}` : key);

  for (const [key, raw] of Object.entries(input)) {
    if (opts.readOnlyKeys?.has(key)) {
      issues.push({ field: name(key), message: 'This field is read-only' });
      continue;
    }
    const def = byKey.get(key);
    if (!def) {
      issues.push({ field: name(key), message: 'Unknown field' });
      continue;
    }
    if (raw === null) {
      if (def.required && !opts.allowClearRequired) {
        issues.push({ field: name(key), message: 'This field is required' });
      } else {
        values[key] = null;
      }
      continue;
    }
    const checked = await checkValue(def, raw, opts);
    if (checked.error !== undefined) {
      issues.push({ field: name(key), message: checked.error });
    } else if (def.required && !isFilled(def.type, checked.value)) {
      issues.push({ field: name(key), message: 'This field is required' });
    } else {
      values[key] = checked.value as string | number | boolean;
    }
  }

  if (opts.requireAll) {
    for (const def of fields) {
      if (!def.required || opts.readOnlyKeys?.has(def.key)) continue;
      if (!isFilled(def.type, values[def.key])) {
        if (!issues.some((i) => i.field === name(def.key))) {
          issues.push({
            field: name(def.key),
            message: 'This field is required',
          });
        }
      }
    }
  }
  return { values, issues };
}

export function throwIfIssues(issues: ValidationIssue[]): void {
  if (issues.length > 0) {
    throw badRequest('VALIDATION_FAILED', 'Validation failed', issues);
  }
}
