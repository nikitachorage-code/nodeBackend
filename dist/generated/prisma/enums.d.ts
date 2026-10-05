export declare const Role: {
    readonly ADMIN: "ADMIN";
    readonly CANDIDATE: "CANDIDATE";
    readonly DIPLOMAT: "DIPLOMAT";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const CertificationStatus: {
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
};
export type CertificationStatus = (typeof CertificationStatus)[keyof typeof CertificationStatus];
