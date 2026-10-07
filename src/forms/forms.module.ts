import { Module } from '@nestjs/common';
import {
  AdminFormConfigController,
  FormsController,
} from './form-config.controller.js';
import { FormConfigService } from './form-config.service.js';

@Module({
  controllers: [FormsController, AdminFormConfigController],
  providers: [FormConfigService],
  exports: [FormConfigService],
})
export class FormsModule {}
