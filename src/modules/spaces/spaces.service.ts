import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { QuerySpacesDto } from './dto/query-spaces.dto';
import { calculateEndTime } from '../../common/utils/time.util';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  getTypes() {
    return {
      message: 'Daftar tipe space berhasil dimuat.',
      data: [
        {
          tipe: 'desk',
          nama: 'Personal Desk',
          deskripsi: 'Meja kerja individual cocok untuk freelancer, remote worker, dan mahasiswa.',
        },
        {
          tipe: 'meeting_room',
          nama: 'Meeting Room',
          deskripsi: 'Ruang rapat berkapasitas sedang dengan perlengkapan presentasi dan Smart TV.',
        },
        {
          tipe: 'private_office',
          nama: 'Private Office',
          deskripsi: 'Ruangan kantor tertutup untuk tim bisnis dan privasi operasional maksimal.',
        },
      ],
    };
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const space = await this.prisma.space.findUnique({
      where: { id: dto.id_space },
    });

    if (!space) {
      throw new NotFoundException(`Space dengan ID ${dto.id_space} tidak ditemukan.`);
    }

    const jam_selesai = calculateEndTime(dto.jam_mulai, dto.durasi_jam);
    const targetDate = new Date(dto.tanggal);

    // ponytail: overlap detection condition (startA < endB AND endA > startB)
    const conflicts = await this.prisma.reservasi.findMany({
      where: {
        id_space: dto.id_space,
        tanggal_reservasi: targetDate,
        status: { not: 'dibatalkan' },
        jam_mulai: { lt: jam_selesai },
        jam_selesai: { gt: dto.jam_mulai },
      },
      select: {
        id: true,
        kode_booking: true,
        jam_mulai: true,
        jam_selesai: true,
        durasi_jam: true,
        status: true,
      },
    });

    const isAvailable = conflicts.length === 0;

    return {
      message: isAvailable
        ? 'Space tersedia untuk dipesan.'
        : 'Space tidak tersedia pada jadwal tersebut (terjadi bentrok).',
      data: {
        available: isAvailable,
        space: {
          id: space.id,
          nama_space: space.nama_space,
          tipe: space.tipe,
          harga_per_jam: space.harga_per_jam,
        },
        jadwal: {
          tanggal: dto.tanggal,
          jam_mulai: dto.jam_mulai,
          jam_selesai,
          durasi_jam: dto.durasi_jam,
        },
        konflik: conflicts,
      },
    };
  }

  async findAll(query: QuerySpacesDto) {
    const where: Prisma.SpaceWhereInput = {};

    if (query.tipe) {
      where.tipe = query.tipe;
    }

    if (query.search) {
      where.OR = [
        { nama_space: { contains: query.search, mode: 'insensitive' } },
        { deskripsi: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const spaces = await this.prisma.space.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Katalog space berhasil dimuat.',
      data: spaces,
    };
  }

  async findOne(id: number) {
    const space = await this.prisma.space.findUnique({
      where: { id },
    });

    if (!space) {
      throw new NotFoundException(`Space dengan ID ${id} tidak ditemukan.`);
    }

    return {
      message: 'Detail space berhasil dimuat.',
      data: space,
    };
  }
}
