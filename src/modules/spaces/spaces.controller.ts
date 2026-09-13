import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { SpacesService } from './spaces.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { QuerySpacesDto } from './dto/query-spaces.dto';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { MakerId } from '../../common/decorators/maker.decorator';

@ApiTags('Katalog & Ketersediaan Space')
@Controller('api/spaces')
@UseGuards(MakerAuthGuard)
@ApiHeader({
  name: 'x-maker-key',
  description: 'App key unik siswa untuk isolasi multi-tenant',
  required: true,
})
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get('types')
  @ApiOperation({
    summary: 'Daftar Tipe Space (Endpoint #12)',
    description: 'Menampilkan daftar statis tipe space (Personal Desk, Meeting Room, Private Office).',
  })
  @ApiResponse({ status: 200, description: 'Daftar tipe space' })
  getTypes() {
    return this.spacesService.getTypes();
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Cek Ketersediaan Space Berdasarkan Tanggal & Jam (Endpoint #13)',
    description: 'Mendeteksi overlap jadwal dengan reservasi lain yang aktif pada tenant yang sama.',
  })
  @ApiResponse({ status: 200, description: 'Status ketersediaan space' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  checkAvailability(
    @Query() dto: CheckAvailabilityDto,
    @MakerId() makerId: number,
  ) {
    return this.spacesService.checkAvailability(dto, makerId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lihat Semua Space Coworking (Endpoint #14)',
    description: 'Menampilkan katalog space dengan filter opsional berdasarkan tipe dan kata kunci pencarian.',
  })
  @ApiResponse({ status: 200, description: 'Daftar katalog space' })
  findAll(@Query() query: QuerySpacesDto, @MakerId() makerId: number) {
    return this.spacesService.findAll(query, makerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lihat Detail Space Coworking Berdasarkan ID (Endpoint #15)',
    description: 'Menampilkan informasi lengkap sebuah space berdasarkan ID.',
  })
  @ApiParam({ name: 'id', description: 'ID space yang dicari', type: Number })
  @ApiResponse({ status: 200, description: 'Detail space ditemukan' })
  @ApiResponse({ status: 404, description: 'Space tidak ditemukan' })
  findOne(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.spacesService.findOne(id, makerId);
  }
}
