import { Request } from 'express';
import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

function storageFor(kategori: string) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dir = `${process.cwd()}/uploads/${kategori}`;
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${kategori}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
    },
  });
}

const apiFileBody = {
  schema: {
    type: 'object',
    properties: { file: { type: 'string', format: 'binary' } },
    required: ['file'],
  },
};

@ApiTags('Upload Media')
@Controller('api/upload')
@UseGuards(MakerAuthGuard, JwtUserAuthGuard)
@ApiHeader({ name: 'x-maker-key', description: 'App key unik siswa untuk isolasi multi-tenant', required: true })
@ApiBearerAuth('JWT-auth')
export class UploadController {
  private result(req: Request, kategori: string, file?: any) {
    if (!file) throw new BadRequestException('Berkas gambar wajib disertakan pada field "file".');
    const base = `${req.protocol}://${req.get('host')}`;
    return {
      message: 'Berkas gambar berhasil diunggah.',
      data: {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        kategori,
        url: `${base}/uploads/${kategori}/${file.filename}`,
      },
    };
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file', { storage: storageFor('general'), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req: any, file: any, cb: any) => { if (!IMAGE_MIME.includes(file.mimetype)) return cb(new BadRequestException('Hanya berkas gambar (jpeg/png/webp/gif) yang diizinkan.'), false); cb(null, true); } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody(apiFileBody)
  @ApiOperation({ summary: 'Upload Berkas Gambar Umum (Endpoint #48)' })
  @ApiResponse({ status: 201, description: 'Berkas terunggah' })
  uploadGeneral(@UploadedFile() file: any, req: any) { return this.result(req, 'general', file); }

  @Post('spaces')
  @UseInterceptors(FileInterceptor('file', { storage: storageFor('spaces'), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req: any, file: any, cb: any) => { if (!IMAGE_MIME.includes(file.mimetype)) return cb(new BadRequestException('Hanya berkas gambar (jpeg/png/webp/gif) yang diizinkan.'), false); cb(null, true); } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody(apiFileBody)
  @ApiOperation({ summary: 'Upload Foto Ruangan / Meja Space (Endpoint #49)' })
  @ApiResponse({ status: 201, description: 'Foto space terunggah' })
  uploadSpace(@UploadedFile() file: any, req: any) { return this.result(req, 'spaces', file); }

  @Post('members')
  @UseInterceptors(FileInterceptor('file', { storage: storageFor('members'), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req: any, file: any, cb: any) => { if (!IMAGE_MIME.includes(file.mimetype)) return cb(new BadRequestException('Hanya berkas gambar (jpeg/png/webp/gif) yang diizinkan.'), false); cb(null, true); } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody(apiFileBody)
  @ApiOperation({ summary: 'Upload Foto Profil Member / Pelanggan (Endpoint #50)' })
  @ApiResponse({ status: 201, description: 'Foto member terunggah' })
  uploadMember(@UploadedFile() file: any, req: any) { return this.result(req, 'members', file); }
}
