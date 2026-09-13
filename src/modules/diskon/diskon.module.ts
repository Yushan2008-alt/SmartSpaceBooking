import { Module } from '@nestjs/common';
import { DiskonController } from './diskon.controller';
import { DiskonService } from './diskon.service';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';

@Module({
  controllers: [DiskonController],
  providers: [DiskonService, MakerAuthGuard],
  exports: [DiskonService],
})
export class DiskonModule {}
