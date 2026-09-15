import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ReservasiStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservasiStateService } from '../reservasi/reservasi-state.service';
import { UpdateCoworkingProfileDto } from './dto/update-profile.dto';
import { CreateMemberAdminDto } from './dto/create-member-admin.dto';
import { UpdateMemberAdminDto } from './dto/update-member-admin.dto';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CreateDiskonDto } from './dto/create-diskon.dto';
import { UpdateDiskonDto } from './dto/update-diskon.dto';
import { QueryAdminReservasiDto } from './dto/query-admin-reservasi.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateService: ReservasiStateService,
  ) {}

  // ==========================================
  // 1. PROFIL COWORKING (Endpoint #25, #26)
  // ==========================================
  async getProfile(userId: number, makerId: number) {
    const spaceOwner = await this.prisma.spaceOwner.findFirst({
      where: { user_id: userId, maker_id: makerId },
      include: {
        user: {
          select: { id: true, username: true, role: true, created_at: true },
        },
      },
    });

    if (!spaceOwner) {
      throw new NotFoundException('Profil coworking space tidak ditemukan.');
    }

    return {
      message: 'Profil lokasi coworking berhasil dimuat.',
      data: spaceOwner,
    };
  }

  async updateProfile(userId: number, makerId: number, dto: UpdateCoworkingProfileDto) {
    const spaceOwner = await this.prisma.spaceOwner.findFirst({
      where: { user_id: userId, maker_id: makerId },
    });

    if (!spaceOwner) {
      throw new NotFoundException('Profil coworking space tidak ditemukan.');
    }

    const updated = await this.prisma.spaceOwner.update({
      where: { id: spaceOwner.id },
      data: {
        nama_coworking: dto.nama_coworking,
        nama_pemilik: dto.nama_pemilik,
        telp: dto.telp,
      },
    });

    return {
      message: 'Profil lokasi coworking berhasil diperbarui.',
      data: updated,
    };
  }

  // ==========================================
  // 2. MANAJEMEN MEMBER (Endpoint #27–31)
  // ==========================================
  async findAllMembers(makerId: number) {
    const members = await this.prisma.member.findMany({
      where: { maker_id: makerId },
      include: {
        user: { select: { id: true, username: true, role: true, created_at: true } },
      },
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Daftar semua member berhasil dimuat.',
      data: members,
    };
  }

  async createMember(makerId: number, dto: CreateMemberAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        username_maker_id: {
          username: dto.username,
          maker_id: makerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Username '${dto.username}' sudah terdaftar pada tenant ini.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        role: Role.member,
        maker_id: makerId,
        member: {
          create: {
            nama_member: dto.nama_member,
            instansi: dto.instansi,
            alamat: dto.alamat,
            telp: dto.telp,
            foto: dto.foto || null,
            maker_id: makerId,
          },
        },
      },
      include: { member: true },
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
    };

    return {
      message: 'Member baru berhasil ditambahkan.',
      data: {
        ...user.member,
        user: safeUser,
      },
    };
  }

  async findMemberById(id: number, makerId: number) {
    const member = await this.prisma.member.findFirst({
      where: { id, maker_id: makerId },
      include: {
        user: { select: { id: true, username: true, role: true, created_at: true } },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member dengan ID ${id} tidak ditemukan.`);
    }

    return {
      message: 'Detail data member berhasil dimuat.',
      data: member,
    };
  }

  async updateMember(id: number, makerId: number, dto: UpdateMemberAdminDto) {
    const member = await this.prisma.member.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!member) {
      throw new NotFoundException(`Member dengan ID ${id} tidak ditemukan.`);
    }

    // Update member profile
    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: {
        nama_member: dto.nama_member,
        instansi: dto.instansi,
        alamat: dto.alamat,
        telp: dto.telp,
        foto: dto.foto,
      },
    });

    // Reset password user if provided
    if (dto.password) {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      await this.prisma.user.update({
        where: { id: member.user_id },
        data: { password: hashedPassword },
      });
    }

    return {
      message: 'Data member berhasil diperbarui.',
      data: updatedMember,
    };
  }

  async deleteMember(id: number, makerId: number) {
    const member = await this.prisma.member.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!member) {
      throw new NotFoundException(`Member dengan ID ${id} tidak ditemukan.`);
    }

    // Delete user will cascade delete member profile
    await this.prisma.user.delete({
      where: { id: member.user_id },
    });

    return {
      message: 'Data member berhasil dihapus.',
      data: { id },
    };
  }

  // ==========================================
  // 3. MANAJEMEN SPACES (Endpoint #32–36)
  // ==========================================
  async findAllSpaces(makerId: number) {
    const spaces = await this.prisma.space.findMany({
      where: { maker_id: makerId },
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Daftar semua space berhasil dimuat.',
      data: spaces,
    };
  }

  async createSpace(makerId: number, dto: CreateSpaceDto) {
    const space = await this.prisma.space.create({
      data: {
        nama_space: dto.nama_space,
        harga_per_jam: dto.harga_per_jam,
        tipe: dto.tipe,
        kapasitas: dto.kapasitas,
        deskripsi: dto.deskripsi,
        foto: dto.foto || null,
        maker_id: makerId,
      },
    });

    return {
      message: 'Space baru berhasil ditambahkan.',
      data: space,
    };
  }

  async findSpaceById(id: number, makerId: number) {
    const space = await this.prisma.space.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!space) {
      throw new NotFoundException(`Space dengan ID ${id} tidak ditemukan.`);
    }

    return {
      message: 'Detail space berhasil dimuat.',
      data: space,
    };
  }

  async updateSpace(id: number, makerId: number, dto: UpdateSpaceDto) {
    const space = await this.prisma.space.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!space) {
      throw new NotFoundException(`Space dengan ID ${id} tidak ditemukan.`);
    }

    const updated = await this.prisma.space.update({
      where: { id },
      data: {
        nama_space: dto.nama_space,
        harga_per_jam: dto.harga_per_jam,
        tipe: dto.tipe,
        kapasitas: dto.kapasitas,
        deskripsi: dto.deskripsi,
        foto: dto.foto,
      },
    });

    return {
      message: 'Data space berhasil diperbarui.',
      data: updated,
    };
  }

  async deleteSpace(id: number, makerId: number) {
    const space = await this.prisma.space.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!space) {
      throw new NotFoundException(`Space dengan ID ${id} tidak ditemukan.`);
    }

    await this.prisma.space.delete({
      where: { id },
    });

    return {
      message: 'Space berhasil dihapus.',
      data: { id },
    };
  }

  // ==========================================
  // 4. MANAJEMEN DISKON (Endpoint #37–41)
  // ==========================================
  async findAllDiskon(makerId: number) {
    const diskons = await this.prisma.diskon.findMany({
      where: { maker_id: makerId },
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Daftar semua promo diskon berhasil dimuat.',
      data: diskons,
    };
  }

  async createDiskon(makerId: number, dto: CreateDiskonDto) {
    const existing = await this.prisma.diskon.findFirst({
      where: {
        nama_diskon: dto.nama_diskon.trim(),
        maker_id: makerId,
      },
    });

    if (existing) {
      throw new ConflictException(`Kode promo '${dto.nama_diskon}' sudah digunakan.`);
    }

    const diskon = await this.prisma.diskon.create({
      data: {
        nama_diskon: dto.nama_diskon.trim(),
        persentase_diskon: dto.persentase_diskon,
        tanggal_awal: new Date(dto.tanggal_awal),
        tanggal_akhir: new Date(dto.tanggal_akhir),
        maker_id: makerId,
      },
    });

    return {
      message: 'Promo diskon baru berhasil dibuat.',
      data: diskon,
    };
  }

  async findDiskonById(id: number, makerId: number) {
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

  async updateDiskon(id: number, makerId: number, dto: UpdateDiskonDto) {
    const diskon = await this.prisma.diskon.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!diskon) {
      throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    }

    if (dto.nama_diskon && dto.nama_diskon.trim() !== diskon.nama_diskon) {
      const existing = await this.prisma.diskon.findFirst({
        where: {
          nama_diskon: dto.nama_diskon.trim(),
          maker_id: makerId,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(`Kode promo '${dto.nama_diskon}' sudah digunakan.`);
      }
    }

    const updated = await this.prisma.diskon.update({
      where: { id },
      data: {
        nama_diskon: dto.nama_diskon?.trim(),
        persentase_diskon: dto.persentase_diskon,
        tanggal_awal: dto.tanggal_awal ? new Date(dto.tanggal_awal) : undefined,
        tanggal_akhir: dto.tanggal_akhir ? new Date(dto.tanggal_akhir) : undefined,
      },
    });

    return {
      message: 'Promo diskon berhasil diperbarui.',
      data: updated,
    };
  }

  async deleteDiskon(id: number, makerId: number) {
    const diskon = await this.prisma.diskon.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!diskon) {
      throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    }

    await this.prisma.diskon.delete({
      where: { id },
    });

    return {
      message: 'Promo diskon berhasil dihapus.',
      data: { id },
    };
  }

  // ==========================================
  // 5. TRANSAKSI RESERVASI & STATUS (Endpoint #42–45)
  // ==========================================
  async findAllReservasi(makerId: number, query: QueryAdminReservasiDto) {
    const where: Prisma.ReservasiWhereInput = {
      maker_id: makerId,
    };

    if (query.id_space) {
      where.id_space = query.id_space;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.tanggal) {
      where.tanggal_reservasi = new Date(query.tanggal);
    }

    if (query.year && query.month) {
      const start = new Date(query.year, query.month - 1, 1);
      const end = new Date(query.year, query.month, 0, 23, 59, 59, 999);
      where.tanggal_reservasi = { gte: start, lte: end };
    } else if (query.year) {
      const start = new Date(query.year, 0, 1);
      const end = new Date(query.year, 11, 31, 23, 59, 59, 999);
      where.tanggal_reservasi = { gte: start, lte: end };
    }

    const reservasis = await this.prisma.reservasi.findMany({
      where,
      include: {
        space: true,
        member: true,
        diskon: true,
      },
      orderBy: [{ tanggal_reservasi: 'desc' }, { created_at: 'desc' }],
    });

    return {
      message: 'Daftar seluruh reservasi berhasil dimuat.',
      data: reservasis,
    };
  }

  async updateReservasiStatus(id: number, makerId: number, newStatus: ReservasiStatus) {
    const reservasi = await this.prisma.reservasi.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!reservasi) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi state machine terpusat
    this.stateService.validateTransition(reservasi.status, newStatus);

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: newStatus },
      include: {
        space: true,
        member: true,
        diskon: true,
      },
    });

    return {
      message: `Status reservasi berhasil diubah menjadi '${newStatus}'.`,
      data: updated,
    };
  }

  async checkIn(id: number, makerId: number) {
    const reservasi = await this.prisma.reservasi.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!reservasi) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi state machine: hanya dari disetujui -> aktif
    this.stateService.validateTransition(reservasi.status, ReservasiStatus.aktif);

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: ReservasiStatus.aktif },
      include: {
        space: true,
        member: true,
      },
    });

    return {
      message: 'Check-in berhasil. Status reservasi sekarang aktif.',
      data: updated,
    };
  }

  async checkOut(id: number, makerId: number) {
    const reservasi = await this.prisma.reservasi.findFirst({
      where: { id, maker_id: makerId },
    });

    if (!reservasi) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi state machine: hanya dari aktif -> selesai
    this.stateService.validateTransition(reservasi.status, ReservasiStatus.selesai);

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: ReservasiStatus.selesai },
      include: {
        space: true,
        member: true,
      },
    });

    return {
      message: 'Check-out berhasil. Penggunaan space telah selesai.',
      data: updated,
    };
  }
}
