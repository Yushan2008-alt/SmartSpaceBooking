import {
  Controller,
  Get,
  Post,
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
  ApiParam,
} from '@nestjs/swagger';
import { DiskonService } from './diskon.service';
import { CheckPromoDto } from './dto/check-promo.dto';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { MakerId } from '../../common/decorators/maker.decorator';

@ApiTags('Diskon & Promo')
@Controller('api/diskon')
@UseGuards(MakerAuthGuard)
@ApiHeader({
  name: 'x-maker-key',
  description: 'App key unik siswa untuk isolasi multi-tenant',
  required: true,
})
export class DiskonController {
  constructor(private readonly diskonService: DiskonService) {}

  @Get('active')
  @ApiOperation({
    summary: 'Daftar Promo / Diskon yang Sedang Aktif (Endpoint #16)',
    description: 'Menampilkan seluruh diskon aktif yang tanggal berlakunya mencakup hari ini.',
  })
  @ApiResponse({ status: 200, description: 'Daftar promo aktif' })
  findActive(@MakerId() makerId: number) {
    return this.diskonService.findActive(makerId);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Periksa Validitas & Hitung Potongan Kode Promo (Endpoint #17)',
    description: 'Mengecek kode promo, status masa berlaku, dan menghitung estimasi potongan harga.',
  })
  @ApiResponse({ status: 200, description: 'Kode promo valid dan kalkulasi potongan harga' })
  @ApiResponse({ status: 400, description: 'Kode promo kadaluarsa atau belum berlaku' })
  @ApiResponse({ status: 404, description: 'Kode promo tidak ditemukan' })
  checkPromo(@Body() dto: CheckPromoDto, @MakerId() makerId: number) {
    return this.diskonService.checkPromo(dto, makerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lihat Detail Diskon Berdasarkan ID (Endpoint #18)',
    description: 'Menampilkan rincian promo diskon berdasarkan ID.',
  })
  @ApiParam({ name: 'id', description: 'ID promo diskon', type: Number })
  @ApiResponse({ status: 200, description: 'Detail diskon ditemukan' })
  @ApiResponse({ status: 404, description: 'Diskon tidak ditemukan' })
  findOne(@Param('id', ParseIntPipe) id: number, @MakerId() makerId: number) {
    return this.diskonService.findOne(id, makerId);
  }
}
