import type { Request } from 'express';
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { STORAGE_SERVICE, StorageService } from './storage/storage.interface';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!IMAGE_MIME.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Hanya berkas gambar (jpeg/png/webp/gif) yang diizinkan.'),
        false,
      );
    }
    cb(null, true);
  },
};

const apiFileBody = {
  schema: {
    type: 'object',
    properties: { file: { type: 'string', format: 'binary' } },
    required: ['file'],
  },
};

@ApiTags('Upload Media')
@Controller('api/upload')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

  private async handleUpload(file: Express.Multer.File, kategori: string, req: Request) {
    if (!file) {
      throw new BadRequestException('Berkas gambar wajib disertakan pada field "file".');
    }
    const base = `${req.protocol}://${req.get('host')}`;
    const result = await this.storageService.saveFile(file, kategori, base);
    return {
      message: 'Berkas gambar berhasil diunggah.',
      data: result,
    };
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody(apiFileBody)
  @ApiOperation({ summary: 'Upload Berkas Gambar Umum (Endpoint #48)' })
  @ApiResponse({ status: 201, description: 'Berkas terunggah' })
  uploadGeneral(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.handleUpload(file, 'general', req);
  }

  @Post('spaces')
  @Roles('admin_space')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody(apiFileBody)
  @ApiOperation({ summary: 'Upload Foto Ruangan / Meja Space (Endpoint #49)' })
  @ApiResponse({ status: 201, description: 'Foto space terunggah' })
  @ApiResponse({ status: 403, description: 'Akses ditolak: hanya pengelola (admin_space) yang berhak mengunggah foto space' })
  uploadSpace(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.handleUpload(file, 'spaces', req);
  }

  @Post('members')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody(apiFileBody)
  @ApiOperation({ summary: 'Upload Foto Profil Member / Pelanggan (Endpoint #50)' })
  @ApiResponse({ status: 201, description: 'Foto member terunggah' })
  uploadMember(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.handleUpload(file, 'members', req);
  }
}
