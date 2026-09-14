import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ReservasiStateService } from '../reservasi/reservasi-state.service';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    ReservasiStateService,
    MakerAuthGuard,
    JwtUserAuthGuard,
    RolesGuard,
  ],
  exports: [AdminService],
})
export class AdminModule {}
