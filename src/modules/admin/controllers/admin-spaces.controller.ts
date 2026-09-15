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
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { CreateSpaceDto } from '../dto/create-space.dto';
import { UpdateSpaceDto } from '../dto/update-space.dto';
import { MakerAuthGuard } from '../../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { MakerId } from '../../../common/decorators/maker.decorator';

@ApiTags('Manajemen Space (Admin)')
@Controller('api/admin/spaces')
@UseGuards(MakerAuthGuard, JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiHeader({
  name: 'x-maker-key',
  description: 'App key unik siswa untuk isolasi multi-tenant',
  required: true,
})
@ApiBearerAuth('JWT-auth')
export class AdminSpacesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Semua Ruangan & Meja Milik Admin (Endpoint #32)',
    description: 'Menampilkan seluruh daftar space yang terdaftar di lokasi admin coworking.',
  })
  @ApiResponse({ status: 200, description: 'Daftar space berhasil dimuat' })
  findAllSpaces(@MakerId() makerId: number) {
    return this.adminService.findAllSpaces(makerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tambah Ruangan / Meja Space Baru (Endpoint #33)',
    description: 'Admin menambahkan ruangan atau meja baru beserta tarif sewa dan fasilitas.',
  })
  @ApiResponse({ status: 201, description: 'Space baru berhasil ditambahkan' })
  createSpace(@MakerId() makerId: number, @Body() dto: CreateSpaceDto) {
    return this.adminService.createSpace(makerId, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Data Space Berdasarkan ID (Endpoint #34)',
    description: 'Menampilkan informasi lengkap sebuah space berdasarkan ID.',
  })
  @ApiParam({ name: 'id', description: 'ID Space', type: Number })
  @ApiResponse({ status: 200, description: 'Detail space ditemukan' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  findSpaceById(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.findSpaceById(id, makerId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update Data Ruangan & Fasilitas Space (Endpoint #35)',
    description: 'Memperbarui nama, harga, tipe, kapasitas, atau deskripsi space.',
  })
  @ApiParam({ name: 'id', description: 'ID Space', type: Number })
  @ApiResponse({ status: 200, description: 'Data space berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  updateSpace(
    @Param('id', ParseIntPipe) id: number,
    @MakerId() makerId: number,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.adminService.updateSpace(id, makerId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus Data Ruangan / Meja Space (Endpoint #36)',
    description: 'Menghapus space dari sistem lokasi.',
  })
  @ApiParam({ name: 'id', description: 'ID Space', type: Number })
  @ApiResponse({ status: 200, description: 'Space berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  deleteSpace(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.adminService.deleteSpace(id, makerId);
  }
}
