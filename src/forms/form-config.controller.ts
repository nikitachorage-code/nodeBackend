import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../common/decorators/decorators.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import {
  CreateFieldDto,
  CreateStepDto,
  UpdateFieldDto,
  UpdateStepDto,
} from './form-config.dto.js';
import { FormConfigService } from './form-config.service.js';

@ApiTags('forms')
@ApiBearerAuth()
@Controller('forms')
export class FormsController {
  constructor(private readonly forms: FormConfigService) {}

  /** Enabled steps and visible fields, including the certification step. */
  @Get()
  list() {
    return this.forms.listForUsers();
  }
}

@ApiTags('admin: form configuration')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminFormConfigController {
  constructor(private readonly forms: FormConfigService) {}

  @Get('steps')
  list() {
    return this.forms.listForAdmin();
  }

  @Post('steps')
  createStep(@CurrentUser() actor: AuthUser, @Body() dto: CreateStepDto) {
    return this.forms.createStep(actor.id, dto);
  }

  @Patch('steps/:id')
  updateStep(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.forms.updateStep(actor.id, id, dto);
  }

  @Post('steps/:id/fields')
  createField(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFieldDto,
  ) {
    return this.forms.createField(actor.id, id, dto);
  }

  @Patch('fields/:id')
  updateField(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.forms.updateField(actor.id, id, dto);
  }

  /** Archives the field; stored data is kept. */
  @Delete('fields/:id')
  archiveField(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.forms.archiveField(actor.id, id);
  }
}
