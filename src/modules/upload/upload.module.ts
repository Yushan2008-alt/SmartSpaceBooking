import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MulterModule.register()],
  controllers: [UploadController],
  providers: [MakerAuthGuard, JwtUserAuthGuard],
})
export class UploadModule {}
