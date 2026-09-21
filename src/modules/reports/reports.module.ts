import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, JwtUserAuthGuard, RolesGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
