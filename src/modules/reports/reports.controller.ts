import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { HistoryQueryDto } from '../reservasi/dto/history-query.dto';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Laporan Pendapatan (Admin)')
@Controller('api/admin/reports')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Rekapitulasi Estimasi & Realisasi Pendapatan Per Bulan (Endpoint #46)' })
  @ApiResponse({ status: 200, description: 'Rekap bulanan beserta breakdown per tipe space' })
  getMonthly(@Query() query: HistoryQueryDto) {
    return this.reportsService.getMonthly(query);
  }

  @Get('income')
  @ApiOperation({ summary: 'Alias Rekapitulasi Pendapatan Bulanan, Versi Ringkas (Endpoint #47)' })
  @ApiResponse({ status: 200, description: 'Ringkasan pendapatan bulanan' })
  getIncome(@Query() query: HistoryQueryDto) {
    return this.reportsService.getIncome(query);
  }
}
