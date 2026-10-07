import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type CertificationModel = runtime.Types.Result.DefaultSelection<Prisma.$CertificationPayload>;
export type AggregateCertification = {
    _count: CertificationCountAggregateOutputType | null;
    _avg: CertificationAvgAggregateOutputType | null;
    _sum: CertificationSumAggregateOutputType | null;
    _min: CertificationMinAggregateOutputType | null;
    _max: CertificationMaxAggregateOutputType | null;
};
export type CertificationAvgAggregateOutputType = {
    cycleNo: number | null;
};
export type CertificationSumAggregateOutputType = {
    cycleNo: number | null;
};
export type CertificationMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    cycleNo: number | null;
    fileId: string | null;
    status: $Enums.CertificationStatus | null;
    uploadedAt: Date | null;
    lapsedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    deletedAt: Date | null;
};
export type CertificationMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    cycleNo: number | null;
    fileId: string | null;
    status: $Enums.CertificationStatus | null;
    uploadedAt: Date | null;
    lapsedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    deletedAt: Date | null;
};
export type CertificationCountAggregateOutputType = {
    id: number;
    userId: number;
    cycleNo: number;
    data: number;
    fileId: number;
    status: number;
    uploadedAt: number;
    lapsedAt: number;
    createdAt: number;
    updatedAt: number;
    deletedAt: number;
    _all: number;
};
export type CertificationAvgAggregateInputType = {
    cycleNo?: true;
};
export type CertificationSumAggregateInputType = {
    cycleNo?: true;
};
export type CertificationMinAggregateInputType = {
    id?: true;
    userId?: true;
    cycleNo?: true;
    fileId?: true;
    status?: true;
    uploadedAt?: true;
    lapsedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    deletedAt?: true;
};
export type CertificationMaxAggregateInputType = {
    id?: true;
    userId?: true;
    cycleNo?: true;
    fileId?: true;
    status?: true;
    uploadedAt?: true;
    lapsedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    deletedAt?: true;
};
export type CertificationCountAggregateInputType = {
    id?: true;
    userId?: true;
    cycleNo?: true;
    data?: true;
    fileId?: true;
    status?: true;
    uploadedAt?: true;
    lapsedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    deletedAt?: true;
    _all?: true;
};
export type CertificationAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CertificationWhereInput;
    orderBy?: Prisma.CertificationOrderByWithRelationInput | Prisma.CertificationOrderByWithRelationInput[];
    cursor?: Prisma.CertificationWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | CertificationCountAggregateInputType;
    _avg?: CertificationAvgAggregateInputType;
    _sum?: CertificationSumAggregateInputType;
    _min?: CertificationMinAggregateInputType;
    _max?: CertificationMaxAggregateInputType;
};
export type GetCertificationAggregateType<T extends CertificationAggregateArgs> = {
    [P in keyof T & keyof AggregateCertification]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateCertification[P]> : Prisma.GetScalarType<T[P], AggregateCertification[P]>;
};
export type CertificationGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CertificationWhereInput;
    orderBy?: Prisma.CertificationOrderByWithAggregationInput | Prisma.CertificationOrderByWithAggregationInput[];
    by: Prisma.CertificationScalarFieldEnum[] | Prisma.CertificationScalarFieldEnum;
    having?: Prisma.CertificationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CertificationCountAggregateInputType | true;
    _avg?: CertificationAvgAggregateInputType;
    _sum?: CertificationSumAggregateInputType;
    _min?: CertificationMinAggregateInputType;
    _max?: CertificationMaxAggregateInputType;
};
export type CertificationGroupByOutputType = {
    id: string;
    userId: string;
    cycleNo: number;
    data: runtime.JsonValue;
    fileId: string | null;
    status: $Enums.CertificationStatus;
    uploadedAt: Date;
    lapsedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    _count: CertificationCountAggregateOutputType | null;
    _avg: CertificationAvgAggregateOutputType | null;
    _sum: CertificationSumAggregateOutputType | null;
    _min: CertificationMinAggregateOutputType | null;
    _max: CertificationMaxAggregateOutputType | null;
};
export type GetCertificationGroupByPayload<T extends CertificationGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<CertificationGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof CertificationGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], CertificationGroupByOutputType[P]> : Prisma.GetScalarType<T[P], CertificationGroupByOutputType[P]>;
}>>;
export type CertificationWhereInput = {
    AND?: Prisma.CertificationWhereInput | Prisma.CertificationWhereInput[];
    OR?: Prisma.CertificationWhereInput[];
    NOT?: Prisma.CertificationWhereInput | Prisma.CertificationWhereInput[];
    id?: Prisma.StringFilter<"Certification"> | string;
    userId?: Prisma.StringFilter<"Certification"> | string;
    cycleNo?: Prisma.IntFilter<"Certification"> | number;
    data?: Prisma.JsonFilter<"Certification">;
    fileId?: Prisma.StringNullableFilter<"Certification"> | string | null;
    status?: Prisma.EnumCertificationStatusFilter<"Certification"> | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    lapsedAt?: Prisma.DateTimeNullableFilter<"Certification"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableFilter<"Certification"> | Date | string | null;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    file?: Prisma.XOR<Prisma.StoredFileNullableScalarRelationFilter, Prisma.StoredFileWhereInput> | null;
};
export type CertificationOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    cycleNo?: Prisma.SortOrder;
    data?: Prisma.SortOrder;
    fileId?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    uploadedAt?: Prisma.SortOrder;
    lapsedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
    file?: Prisma.StoredFileOrderByWithRelationInput;
};
export type CertificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.CertificationWhereInput | Prisma.CertificationWhereInput[];
    OR?: Prisma.CertificationWhereInput[];
    NOT?: Prisma.CertificationWhereInput | Prisma.CertificationWhereInput[];
    userId?: Prisma.StringFilter<"Certification"> | string;
    cycleNo?: Prisma.IntFilter<"Certification"> | number;
    data?: Prisma.JsonFilter<"Certification">;
    fileId?: Prisma.StringNullableFilter<"Certification"> | string | null;
    status?: Prisma.EnumCertificationStatusFilter<"Certification"> | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    lapsedAt?: Prisma.DateTimeNullableFilter<"Certification"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableFilter<"Certification"> | Date | string | null;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    file?: Prisma.XOR<Prisma.StoredFileNullableScalarRelationFilter, Prisma.StoredFileWhereInput> | null;
}, "id">;
export type CertificationOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    cycleNo?: Prisma.SortOrder;
    data?: Prisma.SortOrder;
    fileId?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    uploadedAt?: Prisma.SortOrder;
    lapsedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.CertificationCountOrderByAggregateInput;
    _avg?: Prisma.CertificationAvgOrderByAggregateInput;
    _max?: Prisma.CertificationMaxOrderByAggregateInput;
    _min?: Prisma.CertificationMinOrderByAggregateInput;
    _sum?: Prisma.CertificationSumOrderByAggregateInput;
};
export type CertificationScalarWhereWithAggregatesInput = {
    AND?: Prisma.CertificationScalarWhereWithAggregatesInput | Prisma.CertificationScalarWhereWithAggregatesInput[];
    OR?: Prisma.CertificationScalarWhereWithAggregatesInput[];
    NOT?: Prisma.CertificationScalarWhereWithAggregatesInput | Prisma.CertificationScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Certification"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"Certification"> | string;
    cycleNo?: Prisma.IntWithAggregatesFilter<"Certification"> | number;
    data?: Prisma.JsonWithAggregatesFilter<"Certification">;
    fileId?: Prisma.StringNullableWithAggregatesFilter<"Certification"> | string | null;
    status?: Prisma.EnumCertificationStatusWithAggregatesFilter<"Certification"> | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeWithAggregatesFilter<"Certification"> | Date | string;
    lapsedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Certification"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Certification"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Certification"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Certification"> | Date | string | null;
};
export type CertificationCreateInput = {
    id?: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    user: Prisma.UserCreateNestedOneWithoutCertificationsInput;
    file?: Prisma.StoredFileCreateNestedOneWithoutCertificationsInput;
};
export type CertificationUncheckedCreateInput = {
    id?: string;
    userId: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: string | null;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
};
export type CertificationUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    user?: Prisma.UserUpdateOneRequiredWithoutCertificationsNestedInput;
    file?: Prisma.StoredFileUpdateOneWithoutCertificationsNestedInput;
};
export type CertificationUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type CertificationCreateManyInput = {
    id?: string;
    userId: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: string | null;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
};
export type CertificationUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type CertificationUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type CertificationListRelationFilter = {
    every?: Prisma.CertificationWhereInput;
    some?: Prisma.CertificationWhereInput;
    none?: Prisma.CertificationWhereInput;
};
export type CertificationOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type CertificationCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    cycleNo?: Prisma.SortOrder;
    data?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    uploadedAt?: Prisma.SortOrder;
    lapsedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrder;
};
export type CertificationAvgOrderByAggregateInput = {
    cycleNo?: Prisma.SortOrder;
};
export type CertificationMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    cycleNo?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    uploadedAt?: Prisma.SortOrder;
    lapsedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrder;
};
export type CertificationMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    cycleNo?: Prisma.SortOrder;
    fileId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    uploadedAt?: Prisma.SortOrder;
    lapsedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrder;
};
export type CertificationSumOrderByAggregateInput = {
    cycleNo?: Prisma.SortOrder;
};
export type CertificationCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutUserInput, Prisma.CertificationUncheckedCreateWithoutUserInput> | Prisma.CertificationCreateWithoutUserInput[] | Prisma.CertificationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutUserInput | Prisma.CertificationCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.CertificationCreateManyUserInputEnvelope;
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
};
export type CertificationUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutUserInput, Prisma.CertificationUncheckedCreateWithoutUserInput> | Prisma.CertificationCreateWithoutUserInput[] | Prisma.CertificationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutUserInput | Prisma.CertificationCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.CertificationCreateManyUserInputEnvelope;
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
};
export type CertificationUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutUserInput, Prisma.CertificationUncheckedCreateWithoutUserInput> | Prisma.CertificationCreateWithoutUserInput[] | Prisma.CertificationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutUserInput | Prisma.CertificationCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.CertificationUpsertWithWhereUniqueWithoutUserInput | Prisma.CertificationUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.CertificationCreateManyUserInputEnvelope;
    set?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    disconnect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    delete?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    update?: Prisma.CertificationUpdateWithWhereUniqueWithoutUserInput | Prisma.CertificationUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.CertificationUpdateManyWithWhereWithoutUserInput | Prisma.CertificationUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.CertificationScalarWhereInput | Prisma.CertificationScalarWhereInput[];
};
export type CertificationUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutUserInput, Prisma.CertificationUncheckedCreateWithoutUserInput> | Prisma.CertificationCreateWithoutUserInput[] | Prisma.CertificationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutUserInput | Prisma.CertificationCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.CertificationUpsertWithWhereUniqueWithoutUserInput | Prisma.CertificationUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.CertificationCreateManyUserInputEnvelope;
    set?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    disconnect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    delete?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    update?: Prisma.CertificationUpdateWithWhereUniqueWithoutUserInput | Prisma.CertificationUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.CertificationUpdateManyWithWhereWithoutUserInput | Prisma.CertificationUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.CertificationScalarWhereInput | Prisma.CertificationScalarWhereInput[];
};
export type EnumCertificationStatusFieldUpdateOperationsInput = {
    set?: $Enums.CertificationStatus;
};
export type CertificationCreateNestedManyWithoutFileInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutFileInput, Prisma.CertificationUncheckedCreateWithoutFileInput> | Prisma.CertificationCreateWithoutFileInput[] | Prisma.CertificationUncheckedCreateWithoutFileInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutFileInput | Prisma.CertificationCreateOrConnectWithoutFileInput[];
    createMany?: Prisma.CertificationCreateManyFileInputEnvelope;
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
};
export type CertificationUncheckedCreateNestedManyWithoutFileInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutFileInput, Prisma.CertificationUncheckedCreateWithoutFileInput> | Prisma.CertificationCreateWithoutFileInput[] | Prisma.CertificationUncheckedCreateWithoutFileInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutFileInput | Prisma.CertificationCreateOrConnectWithoutFileInput[];
    createMany?: Prisma.CertificationCreateManyFileInputEnvelope;
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
};
export type CertificationUpdateManyWithoutFileNestedInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutFileInput, Prisma.CertificationUncheckedCreateWithoutFileInput> | Prisma.CertificationCreateWithoutFileInput[] | Prisma.CertificationUncheckedCreateWithoutFileInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutFileInput | Prisma.CertificationCreateOrConnectWithoutFileInput[];
    upsert?: Prisma.CertificationUpsertWithWhereUniqueWithoutFileInput | Prisma.CertificationUpsertWithWhereUniqueWithoutFileInput[];
    createMany?: Prisma.CertificationCreateManyFileInputEnvelope;
    set?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    disconnect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    delete?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    update?: Prisma.CertificationUpdateWithWhereUniqueWithoutFileInput | Prisma.CertificationUpdateWithWhereUniqueWithoutFileInput[];
    updateMany?: Prisma.CertificationUpdateManyWithWhereWithoutFileInput | Prisma.CertificationUpdateManyWithWhereWithoutFileInput[];
    deleteMany?: Prisma.CertificationScalarWhereInput | Prisma.CertificationScalarWhereInput[];
};
export type CertificationUncheckedUpdateManyWithoutFileNestedInput = {
    create?: Prisma.XOR<Prisma.CertificationCreateWithoutFileInput, Prisma.CertificationUncheckedCreateWithoutFileInput> | Prisma.CertificationCreateWithoutFileInput[] | Prisma.CertificationUncheckedCreateWithoutFileInput[];
    connectOrCreate?: Prisma.CertificationCreateOrConnectWithoutFileInput | Prisma.CertificationCreateOrConnectWithoutFileInput[];
    upsert?: Prisma.CertificationUpsertWithWhereUniqueWithoutFileInput | Prisma.CertificationUpsertWithWhereUniqueWithoutFileInput[];
    createMany?: Prisma.CertificationCreateManyFileInputEnvelope;
    set?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    disconnect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    delete?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    connect?: Prisma.CertificationWhereUniqueInput | Prisma.CertificationWhereUniqueInput[];
    update?: Prisma.CertificationUpdateWithWhereUniqueWithoutFileInput | Prisma.CertificationUpdateWithWhereUniqueWithoutFileInput[];
    updateMany?: Prisma.CertificationUpdateManyWithWhereWithoutFileInput | Prisma.CertificationUpdateManyWithWhereWithoutFileInput[];
    deleteMany?: Prisma.CertificationScalarWhereInput | Prisma.CertificationScalarWhereInput[];
};
export type CertificationCreateWithoutUserInput = {
    id?: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    file?: Prisma.StoredFileCreateNestedOneWithoutCertificationsInput;
};
export type CertificationUncheckedCreateWithoutUserInput = {
    id?: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: string | null;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
};
export type CertificationCreateOrConnectWithoutUserInput = {
    where: Prisma.CertificationWhereUniqueInput;
    create: Prisma.XOR<Prisma.CertificationCreateWithoutUserInput, Prisma.CertificationUncheckedCreateWithoutUserInput>;
};
export type CertificationCreateManyUserInputEnvelope = {
    data: Prisma.CertificationCreateManyUserInput | Prisma.CertificationCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type CertificationUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.CertificationWhereUniqueInput;
    update: Prisma.XOR<Prisma.CertificationUpdateWithoutUserInput, Prisma.CertificationUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.CertificationCreateWithoutUserInput, Prisma.CertificationUncheckedCreateWithoutUserInput>;
};
export type CertificationUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.CertificationWhereUniqueInput;
    data: Prisma.XOR<Prisma.CertificationUpdateWithoutUserInput, Prisma.CertificationUncheckedUpdateWithoutUserInput>;
};
export type CertificationUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.CertificationScalarWhereInput;
    data: Prisma.XOR<Prisma.CertificationUpdateManyMutationInput, Prisma.CertificationUncheckedUpdateManyWithoutUserInput>;
};
export type CertificationScalarWhereInput = {
    AND?: Prisma.CertificationScalarWhereInput | Prisma.CertificationScalarWhereInput[];
    OR?: Prisma.CertificationScalarWhereInput[];
    NOT?: Prisma.CertificationScalarWhereInput | Prisma.CertificationScalarWhereInput[];
    id?: Prisma.StringFilter<"Certification"> | string;
    userId?: Prisma.StringFilter<"Certification"> | string;
    cycleNo?: Prisma.IntFilter<"Certification"> | number;
    data?: Prisma.JsonFilter<"Certification">;
    fileId?: Prisma.StringNullableFilter<"Certification"> | string | null;
    status?: Prisma.EnumCertificationStatusFilter<"Certification"> | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    lapsedAt?: Prisma.DateTimeNullableFilter<"Certification"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Certification"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableFilter<"Certification"> | Date | string | null;
};
export type CertificationCreateWithoutFileInput = {
    id?: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    user: Prisma.UserCreateNestedOneWithoutCertificationsInput;
};
export type CertificationUncheckedCreateWithoutFileInput = {
    id?: string;
    userId: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
};
export type CertificationCreateOrConnectWithoutFileInput = {
    where: Prisma.CertificationWhereUniqueInput;
    create: Prisma.XOR<Prisma.CertificationCreateWithoutFileInput, Prisma.CertificationUncheckedCreateWithoutFileInput>;
};
export type CertificationCreateManyFileInputEnvelope = {
    data: Prisma.CertificationCreateManyFileInput | Prisma.CertificationCreateManyFileInput[];
    skipDuplicates?: boolean;
};
export type CertificationUpsertWithWhereUniqueWithoutFileInput = {
    where: Prisma.CertificationWhereUniqueInput;
    update: Prisma.XOR<Prisma.CertificationUpdateWithoutFileInput, Prisma.CertificationUncheckedUpdateWithoutFileInput>;
    create: Prisma.XOR<Prisma.CertificationCreateWithoutFileInput, Prisma.CertificationUncheckedCreateWithoutFileInput>;
};
export type CertificationUpdateWithWhereUniqueWithoutFileInput = {
    where: Prisma.CertificationWhereUniqueInput;
    data: Prisma.XOR<Prisma.CertificationUpdateWithoutFileInput, Prisma.CertificationUncheckedUpdateWithoutFileInput>;
};
export type CertificationUpdateManyWithWhereWithoutFileInput = {
    where: Prisma.CertificationScalarWhereInput;
    data: Prisma.XOR<Prisma.CertificationUpdateManyMutationInput, Prisma.CertificationUncheckedUpdateManyWithoutFileInput>;
};
export type CertificationCreateManyUserInput = {
    id?: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: string | null;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
};
export type CertificationUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    file?: Prisma.StoredFileUpdateOneWithoutCertificationsNestedInput;
};
export type CertificationUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type CertificationUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    fileId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type CertificationCreateManyFileInput = {
    id?: string;
    userId: string;
    cycleNo: number;
    data: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: $Enums.CertificationStatus;
    uploadedAt: Date | string;
    lapsedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
};
export type CertificationUpdateWithoutFileInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    user?: Prisma.UserUpdateOneRequiredWithoutCertificationsNestedInput;
};
export type CertificationUncheckedUpdateWithoutFileInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type CertificationUncheckedUpdateManyWithoutFileInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    cycleNo?: Prisma.IntFieldUpdateOperationsInput | number;
    data?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    status?: Prisma.EnumCertificationStatusFieldUpdateOperationsInput | $Enums.CertificationStatus;
    uploadedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lapsedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type CertificationSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    cycleNo?: boolean;
    data?: boolean;
    fileId?: boolean;
    status?: boolean;
    uploadedAt?: boolean;
    lapsedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    deletedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    file?: boolean | Prisma.Certification$fileArgs<ExtArgs>;
}, ExtArgs["result"]["certification"]>;
export type CertificationSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    cycleNo?: boolean;
    data?: boolean;
    fileId?: boolean;
    status?: boolean;
    uploadedAt?: boolean;
    lapsedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    deletedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    file?: boolean | Prisma.Certification$fileArgs<ExtArgs>;
}, ExtArgs["result"]["certification"]>;
export type CertificationSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    cycleNo?: boolean;
    data?: boolean;
    fileId?: boolean;
    status?: boolean;
    uploadedAt?: boolean;
    lapsedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    deletedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    file?: boolean | Prisma.Certification$fileArgs<ExtArgs>;
}, ExtArgs["result"]["certification"]>;
export type CertificationSelectScalar = {
    id?: boolean;
    userId?: boolean;
    cycleNo?: boolean;
    data?: boolean;
    fileId?: boolean;
    status?: boolean;
    uploadedAt?: boolean;
    lapsedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    deletedAt?: boolean;
};
export type CertificationOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "cycleNo" | "data" | "fileId" | "status" | "uploadedAt" | "lapsedAt" | "createdAt" | "updatedAt" | "deletedAt", ExtArgs["result"]["certification"]>;
export type CertificationInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    file?: boolean | Prisma.Certification$fileArgs<ExtArgs>;
};
export type CertificationIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    file?: boolean | Prisma.Certification$fileArgs<ExtArgs>;
};
export type CertificationIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    file?: boolean | Prisma.Certification$fileArgs<ExtArgs>;
};
export type $CertificationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Certification";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
        file: Prisma.$StoredFilePayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        cycleNo: number;
        data: runtime.JsonValue;
        fileId: string | null;
        status: $Enums.CertificationStatus;
        uploadedAt: Date;
        lapsedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["certification"]>;
    composites: {};
};
export type CertificationGetPayload<S extends boolean | null | undefined | CertificationDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$CertificationPayload, S>;
export type CertificationCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<CertificationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CertificationCountAggregateInputType | true;
};
export interface CertificationDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Certification'];
        meta: {
            name: 'Certification';
        };
    };
    findUnique<T extends CertificationFindUniqueArgs>(args: Prisma.SelectSubset<T, CertificationFindUniqueArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends CertificationFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, CertificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends CertificationFindFirstArgs>(args?: Prisma.SelectSubset<T, CertificationFindFirstArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends CertificationFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, CertificationFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends CertificationFindManyArgs>(args?: Prisma.SelectSubset<T, CertificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends CertificationCreateArgs>(args: Prisma.SelectSubset<T, CertificationCreateArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends CertificationCreateManyArgs>(args?: Prisma.SelectSubset<T, CertificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends CertificationCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, CertificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends CertificationDeleteArgs>(args: Prisma.SelectSubset<T, CertificationDeleteArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends CertificationUpdateArgs>(args: Prisma.SelectSubset<T, CertificationUpdateArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends CertificationDeleteManyArgs>(args?: Prisma.SelectSubset<T, CertificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends CertificationUpdateManyArgs>(args: Prisma.SelectSubset<T, CertificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends CertificationUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, CertificationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends CertificationUpsertArgs>(args: Prisma.SelectSubset<T, CertificationUpsertArgs<ExtArgs>>): Prisma.Prisma__CertificationClient<runtime.Types.Result.GetResult<Prisma.$CertificationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends CertificationCountArgs>(args?: Prisma.Subset<T, CertificationCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], CertificationCountAggregateOutputType> : number>;
    aggregate<T extends CertificationAggregateArgs>(args: Prisma.Subset<T, CertificationAggregateArgs>): Prisma.PrismaPromise<GetCertificationAggregateType<T>>;
    groupBy<T extends CertificationGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: CertificationGroupByArgs['orderBy'];
    } : {
        orderBy?: CertificationGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, CertificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCertificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: CertificationFieldRefs;
}
export interface Prisma__CertificationClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    file<T extends Prisma.Certification$fileArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Certification$fileArgs<ExtArgs>>): Prisma.Prisma__StoredFileClient<runtime.Types.Result.GetResult<Prisma.$StoredFilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface CertificationFieldRefs {
    readonly id: Prisma.FieldRef<"Certification", 'String'>;
    readonly userId: Prisma.FieldRef<"Certification", 'String'>;
    readonly cycleNo: Prisma.FieldRef<"Certification", 'Int'>;
    readonly data: Prisma.FieldRef<"Certification", 'Json'>;
    readonly fileId: Prisma.FieldRef<"Certification", 'String'>;
    readonly status: Prisma.FieldRef<"Certification", 'CertificationStatus'>;
    readonly uploadedAt: Prisma.FieldRef<"Certification", 'DateTime'>;
    readonly lapsedAt: Prisma.FieldRef<"Certification", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"Certification", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Certification", 'DateTime'>;
    readonly deletedAt: Prisma.FieldRef<"Certification", 'DateTime'>;
}
export type CertificationFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    where: Prisma.CertificationWhereUniqueInput;
};
export type CertificationFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    where: Prisma.CertificationWhereUniqueInput;
};
export type CertificationFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    where?: Prisma.CertificationWhereInput;
    orderBy?: Prisma.CertificationOrderByWithRelationInput | Prisma.CertificationOrderByWithRelationInput[];
    cursor?: Prisma.CertificationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CertificationScalarFieldEnum | Prisma.CertificationScalarFieldEnum[];
};
export type CertificationFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    where?: Prisma.CertificationWhereInput;
    orderBy?: Prisma.CertificationOrderByWithRelationInput | Prisma.CertificationOrderByWithRelationInput[];
    cursor?: Prisma.CertificationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CertificationScalarFieldEnum | Prisma.CertificationScalarFieldEnum[];
};
export type CertificationFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    where?: Prisma.CertificationWhereInput;
    orderBy?: Prisma.CertificationOrderByWithRelationInput | Prisma.CertificationOrderByWithRelationInput[];
    cursor?: Prisma.CertificationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CertificationScalarFieldEnum | Prisma.CertificationScalarFieldEnum[];
};
export type CertificationCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CertificationCreateInput, Prisma.CertificationUncheckedCreateInput>;
};
export type CertificationCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.CertificationCreateManyInput | Prisma.CertificationCreateManyInput[];
    skipDuplicates?: boolean;
};
export type CertificationCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    data: Prisma.CertificationCreateManyInput | Prisma.CertificationCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.CertificationIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type CertificationUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CertificationUpdateInput, Prisma.CertificationUncheckedUpdateInput>;
    where: Prisma.CertificationWhereUniqueInput;
};
export type CertificationUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.CertificationUpdateManyMutationInput, Prisma.CertificationUncheckedUpdateManyInput>;
    where?: Prisma.CertificationWhereInput;
    limit?: number;
};
export type CertificationUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CertificationUpdateManyMutationInput, Prisma.CertificationUncheckedUpdateManyInput>;
    where?: Prisma.CertificationWhereInput;
    limit?: number;
    include?: Prisma.CertificationIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type CertificationUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    where: Prisma.CertificationWhereUniqueInput;
    create: Prisma.XOR<Prisma.CertificationCreateInput, Prisma.CertificationUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.CertificationUpdateInput, Prisma.CertificationUncheckedUpdateInput>;
};
export type CertificationDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
    where: Prisma.CertificationWhereUniqueInput;
};
export type CertificationDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CertificationWhereInput;
    limit?: number;
};
export type Certification$fileArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoredFileSelect<ExtArgs> | null;
    omit?: Prisma.StoredFileOmit<ExtArgs> | null;
    include?: Prisma.StoredFileInclude<ExtArgs> | null;
    where?: Prisma.StoredFileWhereInput;
};
export type CertificationDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CertificationSelect<ExtArgs> | null;
    omit?: Prisma.CertificationOmit<ExtArgs> | null;
    include?: Prisma.CertificationInclude<ExtArgs> | null;
};
