import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module.js';
import { FormsModule } from '../forms/forms.module.js';
import { MeController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [FormsModule, FilesModule],
  controllers: [MeController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
