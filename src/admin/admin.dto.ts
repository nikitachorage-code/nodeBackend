import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const USER_SORTS = [
  'name',
  'email',
  'passport',
  'status',
  'progress',
  'registered',
] as const;
export type UserSort = (typeof USER_SORTS)[number];

const toBool = ({ value }: { value: unknown }) =>
  value === 'true' || value === true
    ? true
    : value === 'false' || value === false
      ? false
      : value;

export class UsersQueryDto {
  @ApiPropertyOptional({
    enum: ['ALL', 'CANDIDATE', 'DIPLOMATE'],
    default: 'ALL',
  })
  @IsOptional()
  @IsIn(['ALL', 'CANDIDATE', 'DIPLOMATE'])
  status?: 'ALL' | 'CANDIDATE' | 'DIPLOMATE';

  @ApiPropertyOptional({
    description: 'Matches name, email, passport number or certification number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Only users in Year 2 with no upload yet in Years 1-2',
  })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  atRisk?: boolean;

  @ApiPropertyOptional({ enum: USER_SORTS, default: 'registered' })
  @IsOptional()
  @IsIn(USER_SORTS)
  sort?: UserSort;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description:
      'Comma-separated extra columns as stepKey.fieldKey, e.g. personal_information.phone,education.specialty. See `columns.available` in the response.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  fields?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    example: { personal_information: { phone: '+1 555 0100' } },
    description:
      'Profile answers keyed by step key, then field key. null clears a value.',
  })
  @IsOptional()
  @IsObject()
  answers?: Record<string, Record<string, unknown>>;
}

export class CreateAdminDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  required_certifications_per_cycle?: number;
}

export class AuditQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  actorId?: string;

  @ApiPropertyOptional({ description: 'ISO date/time, inclusive' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date/time, exclusive' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}

export class SetClockDto {
  @ApiPropertyOptional({
    description: 'ISO date/time the server clock should show now',
  })
  @IsOptional()
  @IsDateString()
  now?: string;

  @ApiPropertyOptional({ description: 'true returns the clock to real time' })
  @IsOptional()
  @IsBoolean()
  reset?: boolean;
}
