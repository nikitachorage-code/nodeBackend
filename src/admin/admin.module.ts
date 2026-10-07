import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module.js';
import { FormsModule } from '../forms/forms.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { AdminSystemController } from './admin-system.controller.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';

@Module({
  imports: [FormsModule, ProfileModule, DashboardModule],
  controllers: [AdminUsersController, AdminSystemController],
  providers: [AdminUsersService],
})
export class AdminModule {}
