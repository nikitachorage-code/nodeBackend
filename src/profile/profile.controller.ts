import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { CurrentUser } from '../common/decorators/decorators.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from './profile.service.js';

export class SaveProfileDto {
  @ApiProperty({
    example: { personal_information: { full_name: 'Jane Doe' } },
    description:
      'Partial answers keyed by step key, then field key. null clears a value.',
  })
  @IsObject()
  answers!: Record<string, Record<string, unknown>>;
}

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profile: ProfileService,
  ) {}

  @Get()
  async me(@CurrentUser() user: AuthUser) {
    const row = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const missing =
      row.role === 'USER' ? await this.profile.missingRequired(row.id) : [];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      onboarded: row.onboardedAt !== null,
      profileComplete: missing.length === 0,
      createdAt: row.createdAt,
    };
  }

  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.profile.getProfile(user.id);
  }

  /** Saves a draft. Partial updates are fine; required fields are enforced on submit. */
  @Put('profile')
  save(@CurrentUser() user: AuthUser, @Body() dto: SaveProfileDto) {
    return this.profile.saveProfile(user.id, dto.answers);
  }

  @Post('onboarding/submit')
  @HttpCode(200)
  submit(@CurrentUser() user: AuthUser) {
    return this.profile.submitOnboarding(user.id);
  }
}
