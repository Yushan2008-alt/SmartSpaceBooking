import { Module } from '@nestjs/common';
import { AdminProfileController } from './controllers/admin-profile.controller';
import { AdminMembersController } from './controllers/admin-members.controller';
import { AdminSpacesController } from './controllers/admin-spaces.controller';
import { AdminDiskonController } from './controllers/admin-diskon.controller';
import { AdminReservasiController } from './controllers/admin-reservasi.controller';
import { AdminService } from './admin.service';
import { ReservasiModule } from '../reservasi/reservasi.module';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [ReservasiModule],
  controllers: [
    AdminProfileController,
    AdminMembersController,
    AdminSpacesController,
    AdminDiskonController,
    AdminReservasiController,
  ],
  providers: [
    AdminService,
    JwtUserAuthGuard,
    RolesGuard,
  ],
  exports: [AdminService],
})
export class AdminModule {}
