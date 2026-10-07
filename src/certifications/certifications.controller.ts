import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional } from 'class-validator';
import { CurrentUser, Roles } from '../common/decorators/decorators.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import { CertificationsService } from './certifications.service.js';

export class CertificationBodyDto {
  @ApiProperty({
    example: { certification_number: 'C-001', certificate_file: '<file id>' },
    description:
      'Values keyed by certification field key. upload_date is set by the server and rejected if sent.',
  })
  @IsObject()
  data!: Record<string, unknown>;
}

export class ListCertificationsQuery {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'LAPSED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'LAPSED'])
  status?: 'ACTIVE' | 'LAPSED';
}

@ApiTags('certifications')
@ApiBearerAuth()
@Roles('USER')
@Controller('me/certifications')
export class CertificationsController {
  constructor(private readonly certs: CertificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ListCertificationsQuery) {
    return this.certs.list(user.id, q.status);
  }

  /** 403 ONBOARDING_REQUIRED until onboarding is submitted. */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CertificationBodyDto) {
    return this.certs.create(user, dto.data);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.certs.get(user.id, id);
  }

  /** Lapsed certifications are read-only (409 CERTIFICATION_LAPSED). */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CertificationBodyDto,
  ) {
    return this.certs.update(user, id, dto.data);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.certs.remove(user, id);
  }
}
