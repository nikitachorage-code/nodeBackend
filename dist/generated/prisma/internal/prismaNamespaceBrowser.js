import * as runtime from "@prisma/client/runtime/index-browser";
export const Decimal = runtime.Decimal;
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    User: 'User',
    EmailToken: 'EmailToken',
    Step: 'Step',
    Field: 'Field',
    ProfileAnswer: 'ProfileAnswer',
    Certification: 'Certification',
    StoredFile: 'StoredFile',
    Setting: 'Setting',
    AuditLog: 'AuditLog'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    role: 'role',
    name: 'name',
    status: 'status',
    emailVerifiedAt: 'emailVerifiedAt',
    onboardedAt: 'onboardedAt',
    cycleStartDate: 'cycleStartDate',
    cycleNo: 'cycleNo',
    progressCount: 'progressCount',
    atRisk: 'atRisk',
    warningSentCycle: 'warningSentCycle',
    passportNo: 'passportNo',
    lastCertNo: 'lastCertNo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt'
};
export const EmailTokenScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    type: 'type',
    tokenHash: 'tokenHash',
    expiresAt: 'expiresAt',
    usedAt: 'usedAt',
    createdAt: 'createdAt'
};
export const StepScalarFieldEnum = {
    id: 'id',
    key: 'key',
    title: 'title',
    order: 'order',
    enabled: 'enabled',
    system: 'system',
    repeatable: 'repeatable',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const FieldScalarFieldEnum = {
    id: 'id',
    stepId: 'stepId',
    key: 'key',
    label: 'label',
    type: 'type',
    required: 'required',
    helpText: 'helpText',
    visible: 'visible',
    options: 'options',
    order: 'order',
    system: 'system',
    archivedAt: 'archivedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const ProfileAnswerScalarFieldEnum = {
    userId: 'userId',
    fieldId: 'fieldId',
    value: 'value',
    updatedAt: 'updatedAt'
};
export const CertificationScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    cycleNo: 'cycleNo',
    data: 'data',
    fileId: 'fileId',
    status: 'status',
    uploadedAt: 'uploadedAt',
    lapsedAt: 'lapsedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt'
};
export const StoredFileScalarFieldEnum = {
    id: 'id',
    ownerId: 'ownerId',
    storedName: 'storedName',
    originalName: 'originalName',
    mime: 'mime',
    size: 'size',
    createdAt: 'createdAt'
};
export const SettingScalarFieldEnum = {
    key: 'key',
    value: 'value',
    updatedAt: 'updatedAt'
};
export const AuditLogScalarFieldEnum = {
    id: 'id',
    actorId: 'actorId',
    action: 'action',
    entity: 'entity',
    entityId: 'entityId',
    before: 'before',
    after: 'after',
    createdAt: 'createdAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const NullableJsonNullValueInput = {
    DbNull: DbNull,
    JsonNull: JsonNull
};
export const JsonNullValueInput = {
    JsonNull: JsonNull
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
export const JsonNullValueFilter = {
    DbNull: DbNull,
    JsonNull: JsonNull,
    AnyNull: AnyNull
};
//# sourceMappingURL=prismaNamespaceBrowser.js.map