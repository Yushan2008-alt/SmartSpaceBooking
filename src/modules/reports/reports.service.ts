import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HistoryQueryDto } from '../reservasi/dto/history-query.dto';

const TIPE_ORDER = ['desk', 'meeting_room', 'private_office'] as const;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthly(query: HistoryQueryDto, makerId: number) {
    const now = new Date();
    const year = query.year ?? now.getFullYear();
    const month = query.month ?? now.getMonth() + 1;

    const reservasis = await this.prisma.reservasi.findMany({
      where: {
        maker_id: makerId,
        tanggal_reservasi: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        },
      },
      select: {
        id: true,
        status: true,
        durasi_jam: true,
        total_bayar: true,
        space: { select: { tipe: true } },
      },
    });

    let total_transaksi = 0;
    let total_jam_terpakai = 0;
    let estimasi_pendapatan = 0;
    let realisasi_pendapatan = 0;
    const byTipe: Record<string, { tipe: string; total_transaksi: number; total_jam: number; estimasi_pendapatan: number; realisasi_pendapatan: number }> = {};
    for (const tipe of TIPE_ORDER) byTipe[tipe] = { tipe, total_transaksi: 0, total_jam: 0, estimasi_pendapatan: 0, realisasi_pendapatan: 0 };

    for (const r of reservasis) {
      if (r.status === 'dibatalkan') continue;
      total_transaksi += 1;
      estimasi_pendapatan += r.total_bayar;
      const slot = byTipe[r.space.tipe];
      if (slot) { slot.total_transaksi += 1; slot.estimasi_pendapatan += r.total_bayar; }
      if (r.status === 'selesai') {
        total_jam_terpakai += r.durasi_jam;
        realisasi_pendapatan += r.total_bayar;
        if (slot) { slot.total_jam += r.durasi_jam; slot.realisasi_pendapatan += r.total_bayar; }
      }
    }

    return {
      message: 'Rekapitulasi pendapatan bulanan berhasil dimuat.',
      data: {
        periode: { month, year },
        total_transaksi,
        total_jam_terpakai,
        estimasi_pendapatan,
        realisasi_pendapatan,
        breakdown_per_tipe: TIPE_ORDER.map((t) => byTipe[t]),
      },
    };
  }

  async getIncome(query: HistoryQueryDto, makerId: number) {
    const full = await this.getMonthly(query, makerId);
    const d = full.data;
    return {
      message: 'Ringkasan pendapatan bulanan berhasil dimuat.',
      data: {
        periode: d.periode,
        total_transaksi: d.total_transaksi,
        estimasi_pendapatan: d.estimasi_pendapatan,
        realisasi_pendapatan: d.realisasi_pendapatan,
      },
    };
  }
}
