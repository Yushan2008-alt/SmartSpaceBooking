import { Module } from '@nestjs/common';
import { MakerController } from './maker.controller';
import { MakerService } from './maker.service';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { MakerJwtGuard } from '../../common/guards/maker-jwt.guard';

@Module({
  controllers: [MakerController],
  providers: [MakerService, MakerAuthGuard, MakerJwtGuard],
  exports: [MakerService, MakerAuthGuard, MakerJwtGuard],
})
export class MakerModule {}
