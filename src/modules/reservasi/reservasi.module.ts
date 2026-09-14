import { Module } from '@nestjs/common';
import { ReservasiController } from './reservasi.controller';
import { ReservasiService } from './reservasi.service';
import { ReservasiStateService } from './reservasi-state.service';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [ReservasiController],
  providers: [
    ReservasiService,
    ReservasiStateService,
    MakerAuthGuard,
    JwtUserAuthGuard,
    RolesGuard,
  ],
  exports: [ReservasiService, ReservasiStateService],
})
export class ReservasiModule {}
