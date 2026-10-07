import 'dotenv/config';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/decorators.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import { FilesService } from './files.service.js';

// Decorators are static, so the size limit is read from the environment at import time.
const MAX_BYTES = Number(process.env['MAX_UPLOAD_BYTES'] ?? 5_242_880);

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  /** Returns a file id to put into a FILE field (profile answer or certificate_file). */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES, files: 1 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.files.upload(user, file);
  }

  /** Download. Allowed for the owner or an admin only. */
  @Get(':id')
  download(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.files.open(id, user);
  }
}
