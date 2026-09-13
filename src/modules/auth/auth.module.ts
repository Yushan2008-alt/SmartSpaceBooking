import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtUserAuthGuard, RolesGuard, MakerAuthGuard],
  exports: [AuthService, JwtUserAuthGuard, RolesGuard],
})
export class AuthModule {}
