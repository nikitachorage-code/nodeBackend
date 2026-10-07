import { Global, Module } from '@nestjs/common';
import { SyncService } from './sync.service.js';

@Global()
@Module({ providers: [SyncService], exports: [SyncService] })
export class SyncModule {}
