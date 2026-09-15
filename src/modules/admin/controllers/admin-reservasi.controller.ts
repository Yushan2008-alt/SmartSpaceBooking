import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { QueryAdminReservasiDto } from '../dto/query-admin-reservasi.dto';
import { UpdateReservasiStatusDto } from '../dto/update-reservasi-status.dto';
import { MakerAuthGuard } from '../../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { MakerId } from '../../../common/decorators/maker.decorator';

@ApiTags('Reservasi & Check-in/out (Admin)')
@Controller('api/admin/reservasi')
@UseGuards(MakerAuthGuard, JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiHeader({
  name: 'x-maker-key',
  description: 'App key unik siswa untuk isolasi multi-tenant',
  required: true,
})
@ApiBearerAuth('JWT-auth')
export class AdminReservasiController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Seluruh Reservasi Coworking Space (Endpoint #42)',
    description:
      'Melihat daftar semua reservasi milik coworking space dengan filter bulan, tahun, status, space, atau tanggal spesifik.',
  })
  @ApiResponse({ status: 200, description: 'Daftar reservasi berhasil dimuat' })
  findAllReservasi(
    @MakerId() makerId: number,
    @Query() query: QueryAdminReservasiDto,
  ) {
    return this.adminService.findAllReservasi(makerId, query);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update Status Reservasi Manual (Endpoint #43)',
    description:
      'Admin memperbarui status reservasi mengikuti aturan state machine.',
  })
  @ApiParam({ name: 'id', description: 'ID Reservasi', type: Number })
  @ApiResponse({ status: 200, description: 'Status reservasi berhasil diubah' })
  @ApiResponse({ status: 400, description: 'Transisi status tidak valid' })
  @ApiResponse({ status: 404, description: 'Reservasi tidak ditemukan' })
  updateReservasiStatus(
    @Param('id', ParseIntPipe) id: number,
    @MakerId() makerId: number,
    @Body() dto: UpdateReservasiStatusDto,
  ) {
    return this.adminService.updateReservasiStatus(id, makerId, dto.status);
  }

  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check-in Reservasi Member (Endpoint #44)',
    description:
      'Melakukan check-in member di lokasi fisik coworking. Transisi status dari disetujui menjadi aktif.',
  })
  @ApiParam({ name: 'id', description: 'ID Reservasi', type: Number })
  @ApiResponse({ status: 200, description: 'Check-in berhasil. Status sekarang aktif.' })
  @ApiResponse({ status: 400, description: 'Status reservasi bukan disetujui' })
  @ApiResponse({ status: 404, description: 'Reservasi tidak ditemukan' })
  checkIn(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.checkIn(id, makerId);
  }

  @Post(':id/check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check-out Reservasi Member (Endpoint #45)',
    description:
      'Melakukan check-out member selesai menggunakan space. Transisi status dari aktif menjadi selesai.',
  })
  @ApiParam({ name: 'id', description: 'ID Reservasi', type: Number })
  @ApiResponse({ status: 200, description: 'Check-out berhasil. Status sekarang selesai.' })
  @ApiResponse({ status: 400, description: 'Status reservasi bukan aktif' })
  @ApiResponse({ status: 404, description: 'Reservasi tidak ditemukan' })
  checkOut(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.checkOut(id, makerId);
  }
}
