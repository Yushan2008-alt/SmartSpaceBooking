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
import { CreateDiskonDto } from '../dto/create-diskon.dto';
import { UpdateDiskonDto } from '../dto/update-diskon.dto';
import { JwtUserAuthGuard } from '../../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Manajemen Diskon (Admin)')
@Controller('api/admin/diskon')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiBearerAuth('JWT-auth')
export class AdminDiskonController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Semua Kode Promo / Diskon Event (Endpoint #37)',
    description: 'Menampilkan seluruh daftar promo yang pernah dibuat oleh admin.',
  })
  @ApiResponse({ status: 200, description: 'Daftar diskon berhasil dimuat' })
  findAllDiskon() {
    return this.adminService.findAllDiskon();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tambah Kode Promo / Event Diskon Baru (Endpoint #38)',
    description: 'Admin membuat kode promo atau event diskon baru.',
  })
  @ApiResponse({ status: 201, description: 'Diskon baru berhasil dibuat' })
  @ApiResponse({ status: 409, description: 'Kode promo sudah digunakan' })
  createDiskon(@Body() dto: CreateDiskonDto) {
    return this.adminService.createDiskon(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Data Diskon Berdasarkan ID (Endpoint #39)',
    description: 'Menampilkan informasi rincian promo diskon berdasarkan ID.',
  })
  @ApiParam({ name: 'id', description: 'ID Diskon', type: Number })
  @ApiResponse({ status: 200, description: 'Detail diskon ditemukan' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan' })
  findDiskonById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findDiskonById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update Data Kode Promo & Periode Diskon (Endpoint #40)',
    description: 'Memperbarui kode promo, persentase potongan, atau periode tanggal berlaku.',
  })
  @ApiParam({ name: 'id', description: 'ID Diskon', type: Number })
  @ApiResponse({ status: 200, description: 'Diskon berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan' })
  updateDiskon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiskonDto,
  ) {
    return this.adminService.updateDiskon(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus Kode Promo / Diskon (Endpoint #41)',
    description: 'Menghapus promo diskon dari sistem.',
  })
  @ApiParam({ name: 'id', description: 'ID Diskon', type: Number })
  @ApiResponse({ status: 200, description: 'Diskon berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan' })
  deleteDiskon(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteDiskon(id);
  }
}
