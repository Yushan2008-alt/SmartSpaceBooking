import {
  Injectable,
  NotFoundException,
  ConflictException,
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
  async getProfile(userId: number) {
    const spaceOwner = await this.prisma.spaceOwner.findUnique({
      where: { user_id: userId },
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

  async updateProfile(userId: number, dto: UpdateCoworkingProfileDto) {
    const spaceOwner = await this.prisma.spaceOwner.findUnique({
      where: { user_id: userId },
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
  async findAllMembers() {
    const members = await this.prisma.member.findMany({
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

  async createMember(dto: CreateMemberAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException(`Username '${dto.username}' sudah terdaftar.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        role: Role.member,
        member: {
          create: {
            nama_member: dto.nama_member,
            instansi: dto.instansi,
            alamat: dto.alamat,
            telp: dto.telp,
            foto: dto.foto || null,
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

  async findMemberById(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
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

  async updateMember(id: number, dto: UpdateMemberAdminDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
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

  async deleteMember(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member dengan ID ${id} tidak ditemukan.`);
    }

    // Delete user will cascade delete member profile
    await this.prisma.user.delete({
      where: { id: member.user_id },
    });

    return {
      message: 'Data member dan akun login berhasil dihapus.',
      data: { id },
    };
  }

  // ==========================================
  // 3. MANAJEMEN SPACE (Endpoint #32–36)
  // ==========================================
  async findAllSpaces() {
    const spaces = await this.prisma.space.findMany({
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Daftar semua space berhasil dimuat.',
      data: spaces,
    };
  }

  async createSpace(dto: CreateSpaceDto) {
    const space = await this.prisma.space.create({
      data: {
        nama_space: dto.nama_space,
        harga_per_jam: dto.harga_per_jam,
        tipe: dto.tipe,
        kapasitas: dto.kapasitas,
        deskripsi: dto.deskripsi,
        foto: dto.foto || null,
      },
    });

    return {
      message: 'Space baru berhasil ditambahkan.',
      data: space,
    };
  }

  async findSpaceById(id: number) {
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

  async updateSpace(id: number, dto: UpdateSpaceDto) {
    const space = await this.prisma.space.findUnique({
      where: { id },
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

  async deleteSpace(id: number) {
    const space = await this.prisma.space.findUnique({
      where: { id },
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
  async findAllDiskon() {
    const diskons = await this.prisma.diskon.findMany({
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Daftar semua promo diskon berhasil dimuat.',
      data: diskons,
    };
  }

  async createDiskon(dto: CreateDiskonDto) {
    const existing = await this.prisma.diskon.findUnique({
      where: { nama_diskon: dto.nama_diskon.trim() },
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
      },
    });

    return {
      message: 'Promo diskon baru berhasil dibuat.',
      data: diskon,
    };
  }

  async findDiskonById(id: number) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
    });

    if (!diskon) {
      throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    }

    return {
      message: 'Detail promo diskon berhasil dimuat.',
      data: diskon,
    };
  }

  async updateDiskon(id: number, dto: UpdateDiskonDto) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
    });

    if (!diskon) {
      throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    }

    if (dto.nama_diskon && dto.nama_diskon.trim() !== diskon.nama_diskon) {
      const existing = await this.prisma.diskon.findUnique({
        where: { nama_diskon: dto.nama_diskon.trim() },
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

  async deleteDiskon(id: number) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
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
  async findAllReservasi(query: QueryAdminReservasiDto) {
    const where: Prisma.ReservasiWhereInput = {};

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

  async updateReservasiStatus(id: number, newStatus: ReservasiStatus) {
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { id },
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

  async checkIn(id: number) {
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { id },
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

  async checkOut(id: number) {
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { id },
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
