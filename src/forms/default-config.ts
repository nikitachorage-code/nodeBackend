import type { PrismaClient } from '../generated/prisma/client.js';
import type { FieldType } from '../generated/prisma/enums.js';

export interface DefaultField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  helpText?: string;
  system?: boolean;
}

export interface DefaultStep {
  key: string;
  title: string;
  repeatable?: boolean;
  system?: boolean;
  fields: DefaultField[];
}

/** Key of the system-owned certification step and its fixed fields. */
export const CERT_STEP_KEY = 'certification';
export const CERT_FILE_KEY = 'certificate_file';
export const UPLOAD_DATE_KEY = 'upload_date';
/** Profile field whose value is mirrored on the user row for search/sort. */
export const PASSPORT_FIELD_KEY = 'passport_number';
export const CERT_NUMBER_KEY = 'certification_number';

/** Default steps and fields from the spec (section 3.3). All editable by an admin, except system parts. */
export const DEFAULT_STEPS: DefaultStep[] = [
  {
    key: 'personal_information',
    title: 'Personal Information',
    fields: [
      { key: 'full_name', label: 'Full name', type: 'TEXT', required: true },
      {
        key: 'date_of_birth',
        label: 'Date of birth',
        type: 'DATE',
        required: true,
      },
      {
        key: 'gender',
        label: 'Gender',
        type: 'DROPDOWN',
        required: true,
        options: ['Female', 'Male', 'Other', 'Prefer not to say'],
      },
      {
        key: 'nationality',
        label: 'Nationality',
        type: 'TEXT',
        required: true,
      },
      {
        key: PASSPORT_FIELD_KEY,
        label: 'Passport number',
        type: 'TEXT',
        required: true,
      },
      {
        key: 'passport_expiry',
        label: 'Passport expiry',
        type: 'DATE',
        required: true,
      },
      { key: 'phone', label: 'Phone', type: 'TEXT', required: true },
      { key: 'address', label: 'Address', type: 'LONG_TEXT', required: true },
      { key: 'country', label: 'Country', type: 'TEXT', required: true },
    ],
  },
  {
    key: 'education',
    title: 'Education',
    fields: [
      {
        key: 'medical_school',
        label: 'Medical school',
        type: 'TEXT',
        required: true,
      },
      {
        key: 'degree',
        label: 'Degree',
        type: 'DROPDOWN',
        required: true,
        options: ['MBBS', 'MD', 'DO', 'Other'],
      },
      {
        key: 'graduation_year',
        label: 'Graduation year',
        type: 'NUMBER',
        required: true,
      },
      { key: 'specialty', label: 'Specialty', type: 'TEXT', required: true },
      { key: 'sub_specialty', label: 'Sub-specialty', type: 'TEXT' },
    ],
  },
  {
    key: 'professional',
    title: 'Professional',
    fields: [
      {
        key: 'license_number',
        label: 'Medical license number',
        type: 'TEXT',
        required: true,
      },
      {
        key: 'license_authority',
        label: 'Issuing authority / country',
        type: 'TEXT',
        required: true,
      },
      {
        key: 'license_expiry',
        label: 'License expiry',
        type: 'DATE',
        required: true,
      },
      {
        key: 'employer',
        label: 'Current employer / hospital',
        type: 'TEXT',
        required: true,
      },
      {
        key: 'years_experience',
        label: 'Years of experience',
        type: 'NUMBER',
        required: true,
      },
    ],
  },
  {
    key: CERT_STEP_KEY,
    title: 'Certification',
    repeatable: true,
    system: true,
    fields: [
      {
        key: UPLOAD_DATE_KEY,
        label: 'Upload date',
        type: 'DATE',
        system: true,
        helpText: 'Set by the system when you upload. Read-only.',
      },
      {
        key: CERT_NUMBER_KEY,
        label: 'Certification number',
        type: 'TEXT',
        required: true,
      },
      {
        key: 'certification_name',
        label: 'Certification name / board',
        type: 'TEXT',
        required: true,
      },
      {
        key: 'issuing_body',
        label: 'Issuing body',
        type: 'TEXT',
        required: true,
      },
      { key: 'issue_date', label: 'Issue date', type: 'DATE', required: true },
      {
        key: 'expiry_date',
        label: 'Expiry date',
        type: 'DATE',
        helpText: 'Optional, informational only.',
      },
      {
        key: CERT_FILE_KEY,
        label: 'Certificate file',
        type: 'FILE',
        required: true,
        system: true,
      },
    ],
  },
];

/** Creates any missing default steps/fields. Existing rows are never modified. */
export async function ensureDefaultFormConfig(
  db: Pick<PrismaClient, 'step' | 'field'>,
): Promise<void> {
  let stepOrder = 0;
  for (const s of DEFAULT_STEPS) {
    stepOrder += 1;
    const step =
      (await db.step.findUnique({ where: { key: s.key } })) ??
      (await db.step.create({
        data: {
          key: s.key,
          title: s.title,
          order: stepOrder,
          system: s.system ?? false,
          repeatable: s.repeatable ?? false,
        },
      }));
    let fieldOrder = 0;
    for (const f of s.fields) {
      fieldOrder += 1;
      const exists = await db.field.findUnique({
        where: { stepId_key: { stepId: step.id, key: f.key } },
      });
      if (exists) continue;
      await db.field.create({
        data: {
          stepId: step.id,
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required ?? false,
          helpText: f.helpText ?? null,
          options: f.options ?? undefined,
          order: fieldOrder,
          system: f.system ?? false,
        },
      });
    }
  }
}
