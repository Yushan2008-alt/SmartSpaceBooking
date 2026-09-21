import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { CreateMemberAdminDto } from '../dto/create-member-admin.dto';
import { UpdateMemberAdminDto } from '../dto/update-member-admin.dto';
import { JwtUserAuthGuard } from '../../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Manajemen Member (Admin)')
@Controller('api/admin/members')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiBearerAuth('JWT-auth')
export class AdminMembersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Semua Member / Pelanggan Coworking (Endpoint #27)',
    description: 'Menampilkan seluruh akun pelanggan yang terdaftar.',
  })
  @ApiResponse({ status: 200, description: 'Daftar member berhasil dimuat' })
  findAllMembers() {
    return this.adminService.findAllMembers();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tambah Data Member Baru (Endpoint #28)',
    description: 'Admin menambahkan member baru beserta profil lengkapnya.',
  })
  @ApiResponse({ status: 201, description: 'Member baru berhasil ditambahkan' })
  @ApiResponse({ status: 409, description: 'Username sudah digunakan' })
  createMember(@Body() dto: CreateMemberAdminDto) {
    return this.adminService.createMember(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Data Member Berdasarkan ID (Endpoint #29)',
    description: 'Menampilkan profil detail seorang member berdasarkan ID.',
  })
  @ApiParam({ name: 'id', description: 'ID Member', type: Number })
  @ApiResponse({ status: 200, description: 'Detail member ditemukan' })
  @ApiResponse({ status: 404, description: 'Member tidak ditemukan' })
  findMemberById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findMemberById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update Data Member / Pelanggan (Endpoint #30)',
    description: 'Memperbarui profil member atau melakukan reset password akun member.',
  })
  @ApiParam({ name: 'id', description: 'ID Member', type: Number })
  @ApiResponse({ status: 200, description: 'Data member berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Member tidak ditemukan' })
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberAdminDto,
  ) {
    return this.adminService.updateMember(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus Data Member / Pelanggan (Endpoint #31)',
    description: 'Menghapus data member beserta akun pengguna terkait.',
  })
  @ApiParam({ name: 'id', description: 'ID Member', type: Number })
  @ApiResponse({ status: 200, description: 'Member berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Member tidak ditemukan' })
  deleteMember(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteMember(id);
  }
}
