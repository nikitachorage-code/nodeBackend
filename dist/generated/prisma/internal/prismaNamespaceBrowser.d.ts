import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: "User";
    readonly EmailToken: "EmailToken";
    readonly Step: "Step";
    readonly Field: "Field";
    readonly ProfileAnswer: "ProfileAnswer";
    readonly Certification: "Certification";
    readonly StoredFile: "StoredFile";
    readonly Setting: "Setting";
    readonly AuditLog: "AuditLog";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly passwordHash: "passwordHash";
    readonly role: "role";
    readonly name: "name";
    readonly status: "status";
    readonly emailVerifiedAt: "emailVerifiedAt";
    readonly onboardedAt: "onboardedAt";
    readonly cycleStartDate: "cycleStartDate";
    readonly cycleNo: "cycleNo";
    readonly progressCount: "progressCount";
    readonly atRisk: "atRisk";
    readonly warningSentCycle: "warningSentCycle";
    readonly passportNo: "passportNo";
    readonly lastCertNo: "lastCertNo";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly deletedAt: "deletedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const EmailTokenScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly type: "type";
    readonly tokenHash: "tokenHash";
    readonly expiresAt: "expiresAt";
    readonly usedAt: "usedAt";
    readonly createdAt: "createdAt";
};
export type EmailTokenScalarFieldEnum = (typeof EmailTokenScalarFieldEnum)[keyof typeof EmailTokenScalarFieldEnum];
export declare const StepScalarFieldEnum: {
    readonly id: "id";
    readonly key: "key";
    readonly title: "title";
    readonly order: "order";
    readonly enabled: "enabled";
    readonly system: "system";
    readonly repeatable: "repeatable";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type StepScalarFieldEnum = (typeof StepScalarFieldEnum)[keyof typeof StepScalarFieldEnum];
export declare const FieldScalarFieldEnum: {
    readonly id: "id";
    readonly stepId: "stepId";
    readonly key: "key";
    readonly label: "label";
    readonly type: "type";
    readonly required: "required";
    readonly helpText: "helpText";
    readonly visible: "visible";
    readonly options: "options";
    readonly order: "order";
    readonly system: "system";
    readonly archivedAt: "archivedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type FieldScalarFieldEnum = (typeof FieldScalarFieldEnum)[keyof typeof FieldScalarFieldEnum];
export declare const ProfileAnswerScalarFieldEnum: {
    readonly userId: "userId";
    readonly fieldId: "fieldId";
    readonly value: "value";
    readonly updatedAt: "updatedAt";
};
export type ProfileAnswerScalarFieldEnum = (typeof ProfileAnswerScalarFieldEnum)[keyof typeof ProfileAnswerScalarFieldEnum];
export declare const CertificationScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly cycleNo: "cycleNo";
    readonly data: "data";
    readonly fileId: "fileId";
    readonly status: "status";
    readonly uploadedAt: "uploadedAt";
    readonly lapsedAt: "lapsedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly deletedAt: "deletedAt";
};
export type CertificationScalarFieldEnum = (typeof CertificationScalarFieldEnum)[keyof typeof CertificationScalarFieldEnum];
export declare const StoredFileScalarFieldEnum: {
    readonly id: "id";
    readonly ownerId: "ownerId";
    readonly storedName: "storedName";
    readonly originalName: "originalName";
    readonly mime: "mime";
    readonly size: "size";
    readonly createdAt: "createdAt";
};
export type StoredFileScalarFieldEnum = (typeof StoredFileScalarFieldEnum)[keyof typeof StoredFileScalarFieldEnum];
export declare const SettingScalarFieldEnum: {
    readonly key: "key";
    readonly value: "value";
    readonly updatedAt: "updatedAt";
};
export type SettingScalarFieldEnum = (typeof SettingScalarFieldEnum)[keyof typeof SettingScalarFieldEnum];
export declare const AuditLogScalarFieldEnum: {
    readonly id: "id";
    readonly actorId: "actorId";
    readonly action: "action";
    readonly entity: "entity";
    readonly entityId: "entityId";
    readonly before: "before";
    readonly after: "after";
    readonly createdAt: "createdAt";
};
export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const JsonNullValueInput: {
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
