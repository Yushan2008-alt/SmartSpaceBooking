import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';

@Module({
  controllers: [SpacesController],
  providers: [SpacesService, MakerAuthGuard],
  exports: [SpacesService],
})
export class SpacesModule {}
