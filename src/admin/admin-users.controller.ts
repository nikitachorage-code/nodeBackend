import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../common/decorators/decorators.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import { AdminUsersService } from './admin-users.service.js';
import { CreateAdminDto, UpdateUserDto, UsersQueryDto } from './admin.dto.js';

@ApiTags('admin: users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  /** Candidates and diplomates. Add extra columns with `fields` (see `columns.available`). */
  @Get('users')
  list(@Query() q: UsersQueryDto) {
    return this.users.list(q);
  }

  /** Same filters and columns as the table, as CSV. Formula-looking cells are neutralised. */
  @Get('users/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  exportCsv(@Query() q: UsersQueryDto) {
    return this.users.exportCsv(q);
  }

  @Get('stats')
  stats() {
    return this.users.stats();
  }

  @Get('users/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.detail(id);
  }

  /** Certification history with a plain-language explanation of status and progress. */
  @Get('users/:id/certifications')
  history(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.certificationHistory(id);
  }

  /** Admins can edit name, email and profile answers only. Never certifications. */
  @Patch('users/:id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(actor.id, id, dto);
  }

  @Delete('users/:id')
  remove(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.remove(actor.id, id);
  }

  /** Rebuilds the user's cached status and progress from certification records. */
  @Post('users/:id/sync')
  @HttpCode(200)
  sync(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.resync(id);
  }

  @Post('admins')
  createAdmin(@CurrentUser() actor: AuthUser, @Body() dto: CreateAdminDto) {
    return this.users.createAdmin(actor.id, dto);
  }
}
