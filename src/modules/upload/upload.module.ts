import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { MulterModule } from '@nestjs/platform-express';
import { STORAGE_SERVICE } from './storage/storage.interface';
import { LocalDiskStorageService } from './storage/local-disk-storage.service';
import { CloudinaryStorageService } from './storage/cloudinary-storage.service';

@Module({
  imports: [MulterModule.register()],
  controllers: [UploadController],
  providers: [
    JwtUserAuthGuard,
    {
      provide: STORAGE_SERVICE,
      useFactory: (configService: ConfigService) => {
        const driver = configService.get<string>('STORAGE_DRIVER');
        const nodeEnv = configService.get<string>('NODE_ENV');
        const hasCloudinary =
          !!configService.get('CLOUDINARY_CLOUD_NAME') &&
          !!configService.get('CLOUDINARY_API_KEY');

        // Gunakan Cloudinary jika diset eksplisit atau saat running di environment deploy/production dengan kredensial lengkap
        if (
          driver === 'cloudinary' ||
          (hasCloudinary && (process.env.VERCEL || nodeEnv === 'production'))
        ) {
          return new CloudinaryStorageService(configService);
        }
        // Gunakan LocalDiskStorageService saat NODE_ENV=local atau local dev
        return new LocalDiskStorageService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class UploadModule {}
