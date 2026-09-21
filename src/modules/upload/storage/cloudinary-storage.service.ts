import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageService, StoredFileResult } from './storage.interface';
import { extname } from 'node:path';

@Injectable()
export class CloudinaryStorageService implements StorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      timeout: 60000,
    });
  }

  async saveFile(
    file: Express.Multer.File,
    kategori: string,
  ): Promise<StoredFileResult> {
    const publicId = `${kategori}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    return new Promise<StoredFileResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `smart-space/${kategori}`,
          public_id: publicId,
          resource_type: 'image',
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error(
              `Cloudinary upload failed: ${error?.message || JSON.stringify(error)}`,
            );
            return reject(error);
          }
          resolve({
            filename: `${publicId}${extname(file.originalname).toLowerCase()}`,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            kategori,
            url: result.secure_url,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}
