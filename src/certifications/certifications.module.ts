import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module.js';
import { FormsModule } from '../forms/forms.module.js';
import { CertificationsController } from './certifications.controller.js';
import { CertificationsService } from './certifications.service.js';

@Module({
  imports: [FormsModule, FilesModule],
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}
