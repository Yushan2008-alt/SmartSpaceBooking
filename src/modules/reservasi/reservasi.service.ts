import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReservasiStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservasiStateService } from './reservasi-state.service';
import { CreateReservasiDto } from './dto/create-reservasi.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { calculateEndTime } from '../../common/utils/time.util';

@Injectable()
export class ReservasiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateService: ReservasiStateService,
  ) {}

  async create(dto: CreateReservasiDto, userId: number, makerId: number) {
    // 1. Validasi space di bawah tenant
    const space = await this.prisma.space.findFirst({
      where: { id: dto.id_space, maker_id: makerId },
    });
    if (!space) {
      throw new NotFoundException(`Space dengan ID ${dto.id_space} tidak ditemukan.`);
    }

    // 2. Ambil profil member pengguna
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
    });
    if (!member) {
      throw new ForbiddenException('Hanya akun pelanggan (member) yang dapat membuat reservasi.');
    }

    // 3. Kalkulasi jam_selesai otomatis
    const jam_selesai = calculateEndTime(dto.jam_mulai, dto.durasi_jam);
    const targetDate = new Date(dto.tanggal_reservasi);

    // 4. Deteksi Overlap Jadwal
    const conflict = await this.prisma.reservasi.findFirst({
      where: {
        id_space: dto.id_space,
        maker_id: makerId,
        tanggal_reservasi: targetDate,
        status: { not: ReservasiStatus.dibatalkan },
        jam_mulai: { lt: jam_selesai },
        jam_selesai: { gt: dto.jam_mulai },
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Space tidak tersedia pada jadwal tersebut (bentrok dengan reservasi ${conflict.kode_booking}).`,
      );
    }

    // 5. Kalkulasi Harga dan Diskon Server-Side
    const total_harga_awal = space.harga_per_jam * dto.durasi_jam;
    let potongan_diskon = 0;
    let appliedDiskonId: number | null = null;

    const now = new Date();

    if (dto.id_diskon) {
      const diskon = await this.prisma.diskon.findFirst({
        where: { id: dto.id_diskon, maker_id: makerId },
      });
      if (!diskon) {
        throw new NotFoundException(`Promo diskon dengan ID ${dto.id_diskon} tidak ditemukan.`);
      }
      if (now < diskon.tanggal_awal || now > diskon.tanggal_akhir) {
        throw new BadRequestException('Promo diskon yang dipilih sudah tidak aktif.');
      }
      appliedDiskonId = diskon.id;
      potongan_diskon = Math.floor((total_harga_awal * diskon.persentase_diskon) / 100);
    } else if (dto.kode_promo) {
      const diskon = await this.prisma.diskon.findFirst({
        where: { nama_diskon: dto.kode_promo.trim(), maker_id: makerId },
      });
      if (!diskon) {
        throw new NotFoundException(`Kode promo '${dto.kode_promo}' tidak ditemukan.`);
      }
      if (now < diskon.tanggal_awal || now > diskon.tanggal_akhir) {
        throw new BadRequestException(`Kode promo '${dto.kode_promo}' sudah tidak aktif.`);
      }
      appliedDiskonId = diskon.id;
      potongan_diskon = Math.floor((total_harga_awal * diskon.persentase_diskon) / 100);
    }

    const total_bayar = Math.max(0, total_harga_awal - potongan_diskon);

    // 6. Generate kode_booking unik (format: BOOK-YYYYMMDD-XXXX)
    const dateStr = dto.tanggal_reservasi.replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const kode_booking = `BOOK-${dateStr}-${randomSuffix}`;

    // 7. Simpan Reservasi & Detail Reservasi (Atomic Transaction)
    const result = await this.prisma.$transaction(async (tx) => {
      const reservasi = await tx.reservasi.create({
        data: {
          kode_booking,
          id_member: member.id,
          id_space: space.id,
          id_diskon: appliedDiskonId,
          tanggal_reservasi: targetDate,
          jam_mulai: dto.jam_mulai,
          jam_selesai,
          durasi_jam: dto.durasi_jam,
          harga_per_jam: space.harga_per_jam,
          total_harga_awal,
          potongan_diskon,
          total_bayar,
          status: ReservasiStatus.belum_dikonfirm,
          maker_id: makerId,
        },
        include: {
          space: true,
          member: true,
          diskon: true,
        },
      });

      await tx.detailReservasi.create({
        data: {
          id_reservasi: reservasi.id,
          id_space: space.id,
          id_diskon: appliedDiskonId,
          total_harga: total_bayar,
        },
      });

      return reservasi;
    });

    return {
      message: 'Reservasi berhasil dibuat. Menunggu konfirmasi pengelola.',
      data: result,
    };
  }

  async getMyReservations(userId: number, makerId: number) {
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
    });
    if (!member) {
      throw new ForbiddenException('Data member tidak ditemukan.');
    }

    const reservasis = await this.prisma.reservasi.findMany({
      where: { id_member: member.id, maker_id: makerId },
      include: {
        space: true,
        diskon: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      message: 'Daftar reservasi saya berhasil dimuat.',
      data: reservasis,
    };
  }

  async getMyHistory(userId: number, makerId: number, query: HistoryQueryDto) {
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
    });
    if (!member) {
      throw new ForbiddenException('Data member tidak ditemukan.');
    }

    const where: any = {
      id_member: member.id,
      maker_id: makerId,
    };

    if (query.year && query.month) {
      const start = new Date(query.year, query.month - 1, 1);
      const end = new Date(query.year, query.month, 0, 23, 59, 59, 999);
      where.tanggal_reservasi = { gte: start, lte: end };
    } else if (query.year) {
      const start = new Date(query.year, 0, 1);
      const end = new Date(query.year, 11, 31, 23, 59, 59, 999);
      where.tanggal_reservasi = { gte: start, lte: end };
    }

    const [reservasis, aggregate] = await Promise.all([
      this.prisma.reservasi.findMany({
        where,
        include: {
          space: true,
          diskon: true,
        },
        orderBy: { tanggal_reservasi: 'desc' },
      }),
      this.prisma.reservasi.aggregate({
        where: {
          ...where,
          status: { not: ReservasiStatus.dibatalkan },
        },
        _sum: {
          total_bayar: true,
        },
      }),
    ]);

    return {
      message: 'Histori reservasi berhasil dimuat.',
      data: {
        filter: {
          month: query.month || null,
          year: query.year || null,
        },
        total_pengeluaran: aggregate._sum.total_bayar || 0,
        total_transaksi: reservasis.length,
        reservasi: reservasis,
      },
    };
  }

  async getETicket(id: number, user: any, maker: any) {
    const reservasi = await this.prisma.reservasi.findFirst({
      where: { id, maker_id: maker.id },
      include: {
        space: true,
        member: true,
        diskon: true,
      },
    });

    if (!reservasi) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }

    // Hanya pemilik pemesanan atau admin space yang berhak melihat
    if (user.role === 'member' && reservasi.member.user_id !== user.id) {
      throw new ForbiddenException('Anda tidak berhak melihat e-ticket pemesanan orang lain.');
    }

    const appKey = maker.app_key || 'unknown';
    const qr_code_payload = `VERIFY-RESERVASI-${reservasi.id}-${appKey}`;

    return {
      message: 'E-Ticket reservasi berhasil dimuat.',
      data: {
        e_ticket: {
          id: reservasi.id,
          kode_booking: reservasi.kode_booking,
          qr_code_payload,
          status: reservasi.status,
          customer: {
            nama_member: reservasi.member.nama_member,
            instansi: reservasi.member.instansi,
            telp: reservasi.member.telp,
          },
          space: {
            id: reservasi.space.id,
            nama_space: reservasi.space.nama_space,
            tipe: reservasi.space.tipe,
            kapasitas: reservasi.space.kapasitas,
          },
          jadwal: {
            tanggal_reservasi: reservasi.tanggal_reservasi,
            jam_mulai: reservasi.jam_mulai,
            jam_selesai: reservasi.jam_selesai,
            durasi_jam: reservasi.durasi_jam,
          },
          pembayaran: {
            harga_per_jam: reservasi.harga_per_jam,
            total_harga_awal: reservasi.total_harga_awal,
            potongan_diskon: reservasi.potongan_diskon,
            total_bayar: reservasi.total_bayar,
          },
        },
      },
    };
  }

  async getDetail(id: number, user: any, makerId: number) {
    const reservasi = await this.prisma.reservasi.findFirst({
      where: { id, maker_id: makerId },
      include: {
        space: true,
        member: true,
        diskon: true,
        detailReservasis: true,
      },
    });

    if (!reservasi) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }

    if (user.role === 'member' && reservasi.member.user_id !== user.id) {
      throw new ForbiddenException('Akses ditolak.');
    }

    return {
      message: 'Detail reservasi berhasil dimuat.',
      data: reservasi,
    };
  }

  async cancel(id: number, user: any, makerId: number) {
    const reservasi = await this.prisma.reservasi.findFirst({
      where: { id, maker_id: makerId },
      include: { member: true },
    });

    if (!reservasi) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }

    if (reservasi.member.user_id !== user.id) {
      throw new ForbiddenException('Hanya pemesan yang berhak membatalkan reservasi miliknya.');
    }

    // Validasi state machine: hanya bisa dibatalkan dari belum_dikonfirm atau disetujui
    this.stateService.validateTransition(reservasi.status, ReservasiStatus.dibatalkan);

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: ReservasiStatus.dibatalkan },
      include: {
        space: true,
        member: true,
        diskon: true,
      },
    });

    return {
      message: 'Reservasi berhasil dibatalkan.',
      data: updated,
    };
  }
}
