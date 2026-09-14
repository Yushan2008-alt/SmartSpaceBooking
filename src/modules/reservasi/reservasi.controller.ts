import {
  Controller,
  Post,
  Get,
  Patch,
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
import { ReservasiService } from './reservasi.service';
import { CreateReservasiDto } from './dto/create-reservasi.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MakerId, CurrentMaker } from '../../common/decorators/maker.decorator';
import { CurrentUser, CurrentUserId } from '../../common/decorators/user.decorator';

@ApiTags('Reservasi (Member)')
@Controller('api/reservasi')
@UseGuards(MakerAuthGuard, JwtUserAuthGuard, RolesGuard)
@ApiHeader({
  name: 'x-maker-key',
  description: 'App key unik siswa untuk isolasi multi-tenant',
  required: true,
})
@ApiBearerAuth('JWT-auth')
export class ReservasiController {
  constructor(private readonly reservasiService: ReservasiService) {}

  @Post()
  @Roles('member')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat Pemesanan Space Baru (Endpoint #19)',
    description: 'Pemesanan ruangan/workstation oleh member dengan perhitungan otomatis jam selesai, harga, dan potongan diskon promo.',
  })
  @ApiResponse({ status: 201, description: 'Reservasi berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Data input tidak valid atau promo kadaluarsa' })
  @ApiResponse({ status: 409, description: 'Jadwal bentrok dengan pemesanan lain' })
  create(
    @Body() dto: CreateReservasiDto,
    @CurrentUserId() userId: number,
    @MakerId() makerId: number,
  ) {
    return this.reservasiService.create(dto, userId, makerId);
  }

  @Get('my')
  @Roles('member')
  @ApiOperation({
    summary: 'Lihat Status Semua Pemesanan Milik Sendiri (Endpoint #20)',
    description: 'Menampilkan seluruh daftar pemesanan aktif maupun lampau milik member yang sedang login.',
  })
  @ApiResponse({ status: 200, description: 'Daftar reservasi saya' })
  getMyReservations(
    @CurrentUserId() userId: number,
    @MakerId() makerId: number,
  ) {
    return this.reservasiService.getMyReservations(userId, makerId);
  }

  @Get('my/history')
  @Roles('member')
  @ApiOperation({
    summary: 'Lihat Histori Pemesanan Berdasarkan Bulan & Tahun (Endpoint #21)',
    description: 'Menampilkan riwayat pemesanan dengan filter bulan & tahun serta total pengeluaran belanja.',
  })
  @ApiResponse({ status: 200, description: 'Histori pemesanan dan agregat pengeluaran' })
  getMyHistory(
    @Query() query: HistoryQueryDto,
    @CurrentUserId() userId: number,
    @MakerId() makerId: number,
  ) {
    return this.reservasiService.getMyHistory(userId, makerId, query);
  }

  @Get(':id/e-ticket')
  @ApiOperation({
    summary: 'Cetak E-Ticket / Bukti Nota Digital Reservasi (Endpoint #22)',
    description: 'Menampilkan nota digital dan string payload QR code untuk verifikasi check-in.',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi reservasi', type: Number })
  @ApiResponse({ status: 200, description: 'Data e-ticket beserta qr_code_payload' })
  @ApiResponse({ status: 403, description: 'Akses ditolak' })
  @ApiResponse({ status: 404, description: 'Reservasi tidak ditemukan' })
  getETicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @CurrentMaker() maker: any,
  ) {
    return this.reservasiService.getETicket(id, user, maker);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lihat Detail Reservasi Berdasarkan ID (Endpoint #23)',
    description: 'Menampilkan rincian lengkap transaksi reservasi berdasarkan ID.',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi reservasi', type: Number })
  @ApiResponse({ status: 200, description: 'Detail reservasi ditemukan' })
  @ApiResponse({ status: 404, description: 'Reservasi tidak ditemukan' })
  getDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @MakerId() makerId: number,
  ) {
    return this.reservasiService.getDetail(id, user, makerId);
  }

  @Patch(':id/cancel')
  @Roles('member')
  @ApiOperation({
    summary: 'Batalkan Pemesanan Space (Endpoint #24)',
    description: 'Member membatalkan reservasi miliknya (hanya dapat dibatalkan jika status belum_dikonfirm atau disetujui).',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi reservasi yang dibatalkan', type: Number })
  @ApiResponse({ status: 200, description: 'Reservasi berhasil dibatalkan' })
  @ApiResponse({ status: 400, description: 'Status tidak mengizinkan pembatalan (mis. sudah aktif atau selesai)' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @MakerId() makerId: number,
  ) {
    return this.reservasiService.cancel(id, user, makerId);
  }
}
