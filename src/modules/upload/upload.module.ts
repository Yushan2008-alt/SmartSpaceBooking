import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';

@Module({
  controllers: [UploadController],
  providers: [MakerAuthGuard, JwtUserAuthGuard],
})
export class UploadModule {}
