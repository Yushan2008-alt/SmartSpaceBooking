import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { HistoryQueryDto } from '../reservasi/dto/history-query.dto';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MakerId } from '../../common/decorators/maker.decorator';

@ApiTags('Laporan Pendapatan (Admin)')
@Controller('api/admin/reports')
@UseGuards(MakerAuthGuard, JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiHeader({ name: 'x-maker-key', description: 'App key unik siswa untuk isolasi multi-tenant', required: true })
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Rekapitulasi Estimasi & Realisasi Pendapatan Per Bulan (Endpoint #46)' })
  @ApiResponse({ status: 200, description: 'Rekap bulanan beserta breakdown per tipe space' })
  getMonthly(@Query() query: HistoryQueryDto, @MakerId() makerId: number) {
    return this.reportsService.getMonthly(query, makerId);
  }

  @Get('income')
  @ApiOperation({ summary: 'Alias Rekapitulasi Pendapatan Bulanan, Versi Ringkas (Endpoint #47)' })
  @ApiResponse({ status: 200, description: 'Ringkasan pendapatan bulanan' })
  getIncome(@Query() query: HistoryQueryDto, @MakerId() makerId: number) {
    return this.reportsService.getIncome(query, makerId);
  }
}
