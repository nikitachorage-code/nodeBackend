import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../generated/prisma/client.js';
import type { Env } from '../config/env.validation.js';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(config: ConfigService<Env, true>);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
