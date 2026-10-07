export declare const Role: {
    readonly ADMIN: "ADMIN";
    readonly USER: "USER";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const UserStatus: {
    readonly CANDIDATE: "CANDIDATE";
    readonly DIPLOMATE: "DIPLOMATE";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const CertificationStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly LAPSED: "LAPSED";
};
export type CertificationStatus = (typeof CertificationStatus)[keyof typeof CertificationStatus];
export declare const FieldType: {
    readonly TEXT: "TEXT";
    readonly LONG_TEXT: "LONG_TEXT";
    readonly NUMBER: "NUMBER";
    readonly DATE: "DATE";
    readonly DROPDOWN: "DROPDOWN";
    readonly CHECKBOX: "CHECKBOX";
    readonly FILE: "FILE";
};
export type FieldType = (typeof FieldType)[keyof typeof FieldType];
export declare const EmailTokenType: {
    readonly VERIFY: "VERIFY";
    readonly RESET: "RESET";
};
export type EmailTokenType = (typeof EmailTokenType)[keyof typeof EmailTokenType];
