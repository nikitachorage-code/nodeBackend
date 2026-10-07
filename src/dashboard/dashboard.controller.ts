import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../common/decorators/decorators.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('me')
@ApiBearerAuth()
@Roles('USER')
@Controller('me/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** Current cycle as three year tiles, progress, status, risk warning and past cycles. */
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.dashboard.get(user.id);
  }
}
