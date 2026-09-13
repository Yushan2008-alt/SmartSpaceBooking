import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckPromoDto } from './dto/check-promo.dto';

@Injectable()
export class DiskonService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(makerId: number) {
    const now = new Date();

    const activeDiskons = await this.prisma.diskon.findMany({
      where: {
        maker_id: makerId,
        tanggal_awal: { lte: now },
        tanggal_akhir: { gte: now },
      },
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Daftar promo aktif berhasil dimuat.',
      data: activeDiskons,
    };
  }

  async checkPromo(dto: CheckPromoDto, makerId: number) {
    const diskon = await this.prisma.diskon.findFirst({
      where: {
        nama_diskon: dto.nama_diskon.trim(),
        maker_id: makerId,
      },
    });

    if (!diskon) {
      throw new NotFoundException(`Kode promo '${dto.nama_diskon}' tidak ditemukan.`);
    }

    const now = new Date();

    if (now < diskon.tanggal_awal) {
      throw new BadRequestException('Kode promo belum mulai berlaku.');
    }

    if (now > diskon.tanggal_akhir) {
      throw new BadRequestException('Kode promo sudah kadaluarsa.');
    }

    const totalAwal = dto.total_harga || 0;
    const potongan = Math.floor((totalAwal * diskon.persentase_diskon) / 100);
    const totalBayar = totalAwal - potongan;

    return {
      message: 'Kode promo valid.',
      data: {
        valid: true,
        diskon: {
          id: diskon.id,
          nama_diskon: diskon.nama_diskon,
          persentase_diskon: diskon.persentase_diskon,
          tanggal_awal: diskon.tanggal_awal,
          tanggal_akhir: diskon.tanggal_akhir,
        },
        persentase_diskon: diskon.persentase_diskon,
        total_harga_awal: totalAwal,
        potongan_diskon: potongan,
        total_bayar: totalBayar,
      },
    };
  }

  async findOne(id: number, makerId: number) {
    const diskon = await this.prisma.diskon.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!diskon) {
      throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    }

    return {
      message: 'Detail promo diskon berhasil dimuat.',
      data: diskon,
    };
  }
}
