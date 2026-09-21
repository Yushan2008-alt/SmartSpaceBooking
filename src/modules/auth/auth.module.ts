import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtUserAuthGuard, RolesGuard],
  exports: [AuthService, JwtUserAuthGuard, RolesGuard],
})
export class AuthModule {}
