import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { AdminService } from './admin.service';
import { UpdateCoworkingProfileDto } from './dto/update-coworking-profile.dto';
import { CreateMemberAdminDto } from './dto/create-member-admin.dto';
import { UpdateMemberAdminDto } from './dto/update-member-admin.dto';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CreateDiskonDto } from './dto/create-diskon.dto';
import { UpdateDiskonDto } from './dto/update-diskon.dto';
import { UpdateReservasiStatusDto } from './dto/update-reservasi-status.dto';
import { QueryAdminReservasiDto } from './dto/query-admin-reservasi.dto';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MakerId } from '../../common/decorators/maker.decorator';
import { CurrentUserId } from '../../common/decorators/user.decorator';

@ApiTags('Admin Space')
@Controller('api/admin')
@UseGuards(MakerAuthGuard, JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiHeader({ name: 'x-maker-key', description: 'App key unik siswa untuk isolasi multi-tenant', required: true })
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---------- PROFIL LOKASI ----------
  @Get('profile')
  @ApiOperation({ summary: 'Lihat Data Profil Lokasi Coworking Space (Endpoint #25)' })
  @ApiResponse({ status: 200, description: 'Profil lokasi ditemukan' })
  getProfile(@CurrentUserId() userId: number, @MakerId() makerId: number) {
    return this.adminService.getProfile(userId, makerId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update Data Profil Lokasi Coworking Space (Endpoint #26)' })
  @ApiResponse({ status: 200, description: 'Profil lokasi diperbarui' })
  updateProfile(
    @Body() dto: UpdateCoworkingProfileDto,
    @CurrentUserId() userId: number,
    @MakerId() makerId: number,
  ) {
    return this.adminService.updateProfile(dto, userId, makerId);
  }

  // ---------- MEMBER ----------
  @Get('members')
  @ApiOperation({ summary: 'Daftar Semua Member / Pelanggan Coworking (Endpoint #27)' })
  @ApiResponse({ status: 200, description: 'Daftar member' })
  findAllMembers(@MakerId() makerId: number) {
    return this.adminService.findAllMembers(makerId);
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah Data Member Baru (Endpoint #28)' })
  @ApiResponse({ status: 201, description: 'Member ditambahkan' })
  @ApiResponse({ status: 409, description: 'Username sudah terdaftar' })
  createMember(@Body() dto: CreateMemberAdminDto, @MakerId() makerId: number) {
    return this.adminService.createMember(dto, makerId);
  }

  @Get('members/:id')
  @ApiOperation({ summary: 'Detail Data Member Berdasarkan ID (Endpoint #29)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail member' })
  @ApiResponse({ status: 404, description: 'Member tidak ditemukan' })
  findOneMember(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.findOneMember(id, makerId);
  }

  @Put('members/:id')
  @ApiOperation({ summary: 'Update Data Member / Pelanggan (Endpoint #30)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Member diperbarui' })
  @ApiResponse({ status: 404, description: 'Member tidak ditemukan' })
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberAdminDto,
    @MakerId() makerId: number,
  ) {
    return this.adminService.updateMember(id, dto, makerId);
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'Hapus Data Member / Pelanggan (Endpoint #31)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Member dihapus' })
  @ApiResponse({ status: 404, description: 'Member tidak ditemukan' })
  removeMember(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.removeMember(id, makerId);
  }

  // ---------- SPACE ----------
  @Get('spaces')
  @ApiOperation({ summary: 'Daftar Semua Ruangan & Meja Milik Admin (Endpoint #32)' })
  @ApiResponse({ status: 200, description: 'Daftar space' })
  findAllSpaces(@MakerId() makerId: number) {
    return this.adminService.findAllSpaces(makerId);
  }

  @Post('spaces')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah Ruangan / Meja Space Baru (Endpoint #33)' })
  @ApiResponse({ status: 201, description: 'Space ditambahkan' })
  createSpace(
    @Body() dto: CreateSpaceDto,
    @CurrentUserId() userId: number,
    @MakerId() makerId: number,
  ) {
    return this.adminService.createSpace(dto, userId, makerId);
  }

  @Get('spaces/:id')
  @ApiOperation({ summary: 'Detail Data Space Berdasarkan ID (Endpoint #34)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail space' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  findOneSpace(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.findOneSpace(id, makerId);
  }

  @Put('spaces/:id')
  @ApiOperation({ summary: 'Update Data Ruangan & Fasilitas Space (Endpoint #35)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Space diperbarui' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  updateSpace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpaceDto,
    @MakerId() makerId: number,
  ) {
    return this.adminService.updateSpace(id, dto, makerId);
  }

  @Delete('spaces/:id')
  @ApiOperation({ summary: 'Hapus Data Ruangan / Meja Space (Endpoint #36)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Space dihapus' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  removeSpace(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.removeSpace(id, makerId);
  }

  // ---------- DISKON ----------
  @Get('diskon')
  @ApiOperation({ summary: 'Daftar Semua Kode Promo / Diskon Event (Endpoint #37)' })
  @ApiResponse({ status: 200, description: 'Daftar diskon' })
  findAllDiskon(@MakerId() makerId: number) {
    return this.adminService.findAllDiskon(makerId);
  }

  @Post('diskon')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah Kode Promo / Event Diskon Baru (Endpoint #38)' })
  @ApiResponse({ status: 201, description: 'Diskon ditambahkan' })
  @ApiResponse({ status: 409, description: 'Kode promo sudah terdaftar' })
  createDiskon(@Body() dto: CreateDiskonDto, @MakerId() makerId: number) {
    return this.adminService.createDiskon(dto, makerId);
  }

  @Get('diskon/:id')
  @ApiOperation({ summary: 'Detail Data Diskon Berdasarkan ID (Endpoint #39)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail diskon' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan' })
  findOneDiskon(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.findOneDiskon(id, makerId);
  }

  @Put('diskon/:id')
  @ApiOperation({ summary: 'Update Data Kode Promo & Periode Diskon (Endpoint #40)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Diskon diperbarui' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan' })
  updateDiskon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiskonDto,
    @MakerId() makerId: number,
  ) {
    return this.adminService.updateDiskon(id, dto, makerId);
  }

  @Delete('diskon/:id')
  @ApiOperation({ summary: 'Hapus Kode Promo / Diskon (Endpoint #41)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Diskon dihapus' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan' })
  removeDiskon(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.removeDiskon(id, makerId);
  }

  // ---------- RESERVASI ----------
  @Get('reservasi')
  @ApiOperation({ summary: 'Lihat Seluruh Reservasi Coworking (Endpoint #42)' })
  @ApiResponse({ status: 200, description: 'Daftar reservasi dengan filter' })
  findAllReservasi(@Query() query: QueryAdminReservasiDto, @MakerId() makerId: number) {
    return this.adminService.findAllReservasi(query, makerId);
  }

  @Patch('reservasi/:id/status')
  @ApiOperation({ summary: 'Konfirmasi & Ubah Status Pemesanan (Endpoint #43)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Status diubah' })
  @ApiResponse({ status: 400, description: 'Transisi status tidak diizinkan' })
  @ApiResponse({ status: 404, description: 'Reservasi tidak ditemukan' })
  updateReservasiStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservasiStatusDto,
    @MakerId() makerId: number,
  ) {
    return this.adminService.updateReservasiStatus(id, dto, makerId);
  }

  @Post('reservasi/:id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-In Pelanggan, Status ke Aktif (Endpoint #44)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Check-in berhasil' })
  @ApiResponse({ status: 400, description: 'Hanya reservasi disetujui yang bisa check-in' })
  checkIn(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.checkIn(id, makerId);
  }

  @Post('reservasi/:id/check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-Out Pelanggan, Status ke Selesai (Endpoint #45)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Check-out berhasil' })
  @ApiResponse({ status: 400, description: 'Hanya reservasi aktif yang bisa check-out' })
  checkOut(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.checkOut(id, makerId);
  }
}
