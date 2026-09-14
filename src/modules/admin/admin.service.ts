import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Role, ReservasiStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservasiStateService } from '../reservasi/reservasi-state.service';
import { UpdateCoworkingProfileDto } from './dto/update-coworking-profile.dto';
import { CreateMemberAdminDto } from './dto/create-member-admin.dto';
import { UpdateMemberAdminDto } from './dto/update-member-admin.dto';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CreateDiskonDto } from './dto/create-diskon.dto';
import { UpdateDiskonDto } from './dto/update-diskon.dto';
import { UpdateReservasiStatusDto } from './dto/update-reservasi-status.dto';
import {
  QueryAdminReservasiDto,
  parseTanggalFilter,
} from './dto/query-admin-reservasi.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly state: ReservasiStateService,
  ) {}

  // ============ PROFIL LOKASI (#25-26) ============
  async getProfile(userId: number, makerId: number) {
    const owner = await this.prisma.spaceOwner.findFirst({
      where: { user_id: userId, maker_id: makerId },
    });
    if (!owner) throw new NotFoundException('Profil coworking space tidak ditemukan.');
    return { message: 'Data profil lokasi coworking space berhasil dimuat.', data: owner };
  }

  async updateProfile(dto: UpdateCoworkingProfileDto, userId: number, makerId: number) {
    const owner = await this.prisma.spaceOwner.findFirst({
      where: { user_id: userId, maker_id: makerId },
    });
    if (!owner) throw new NotFoundException('Profil coworking space tidak ditemukan.');
    const updated = await this.prisma.spaceOwner.update({
      where: { id: owner.id },
      data: { ...dto },
    });
    return { message: 'Profil lokasi coworking space berhasil diperbarui.', data: updated };
  }

  // ============ MEMBER (#27-31) ============
  async findAllMembers(makerId: number) {
    const users = await this.prisma.user.findMany({
      where: { maker_id: makerId, role: Role.member },
      select: { id: true, username: true, role: true, maker_id: true, created_at: true, updated_at: true, member: true },
      orderBy: { id: 'asc' },
    });
    return { message: 'Daftar member berhasil dimuat.', data: users };
  }

  async createMember(dto: CreateMemberAdminDto, makerId: number) {
    const existing = await this.prisma.user.findUnique({
      where: { username_maker_id: { username: dto.username, maker_id: makerId } },
    });
    if (existing) throw new ConflictException('Username sudah terdaftar pada tenant ini.');
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: await bcrypt.hash(dto.password, 10),
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
    const { password, ...safe } = user;
    return { message: 'Data member baru berhasil ditambahkan.', data: safe };
  }

  async findOneMember(id: number, makerId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, maker_id: makerId, role: Role.member },
      select: { id: true, username: true, role: true, maker_id: true, created_at: true, updated_at: true, member: true },
    });
    if (!user) throw new NotFoundException(`Member dengan ID ${id} tidak ditemukan.`);
    return { message: 'Detail member berhasil dimuat.', data: user };
  }

  async updateMember(id: number, dto: UpdateMemberAdminDto, makerId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, maker_id: makerId, role: Role.member },
      include: { member: true },
    });
    if (!user || !user.member) throw new NotFoundException(`Member dengan ID ${id} tidak ditemukan.`);
    const { password, ...memberData } = dto;
    await this.prisma.member.update({ where: { id: user.member.id }, data: { ...memberData } });
    if (password) {
      await this.prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(password, 10) } });
    }
    return this.findOneMember(id, makerId).then((r) => ({
      message: 'Data member berhasil diperbarui.',
      data: r.data,
    }));
  }

  async removeMember(id: number, makerId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, maker_id: makerId, role: Role.member },
    });
    if (!user) throw new NotFoundException(`Member dengan ID ${id} tidak ditemukan.`);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Data member berhasil dihapus.', data: { id } };
  }

  // ============ SPACE (#32-36) ============
  async findAllSpaces(makerId: number) {
    const spaces = await this.prisma.space.findMany({
      where: { maker_id: makerId },
      orderBy: { id: 'asc' },
    });
    return { message: 'Daftar space berhasil dimuat.', data: spaces };
  }

  async createSpace(dto: CreateSpaceDto, userId: number, makerId: number) {
    const owner = await this.prisma.spaceOwner.findFirst({ where: { user_id: userId, maker_id: makerId } });
    const space = await this.prisma.space.create({
      data: {
        nama_space: dto.nama_space,
        harga_per_jam: dto.harga_per_jam,
        tipe: dto.tipe,
        kapasitas: dto.kapasitas,
        deskripsi: dto.deskripsi,
        foto: dto.foto || null,
        maker_id: makerId,
        space_owner_id: owner?.id ?? null,
      },
    });
    return { message: 'Data space baru berhasil ditambahkan.', data: space };
  }

  async findOneSpace(id: number, makerId: number) {
    const space = await this.prisma.space.findFirst({ where: { id, maker_id: makerId } });
    if (!space) throw new NotFoundException(`Space dengan ID ${id} tidak ditemukan.`);
    return { message: 'Detail space berhasil dimuat.', data: space };
  }

  async updateSpace(id: number, dto: UpdateSpaceDto, makerId: number) {
    await this.findOneSpace(id, makerId);
    const space = await this.prisma.space.update({ where: { id }, data: { ...dto } });
    return { message: 'Data space berhasil diperbarui.', data: space };
  }

  async removeSpace(id: number, makerId: number) {
    await this.findOneSpace(id, makerId);
    await this.prisma.space.delete({ where: { id } });
    return { message: 'Data space berhasil dihapus.', data: { id } };
  }

  // ============ DISKON (#37-41) ============
  async findAllDiskon(makerId: number) {
    const diskons = await this.prisma.diskon.findMany({
      where: { maker_id: makerId },
      orderBy: { id: 'asc' },
    });
    return { message: 'Daftar diskon berhasil dimuat.', data: diskons };
  }

  async createDiskon(dto: CreateDiskonDto, makerId: number) {
    const existing = await this.prisma.diskon.findUnique({
      where: { nama_diskon_maker_id: { nama_diskon: dto.nama_diskon.trim(), maker_id: makerId } },
    });
    if (existing) throw new ConflictException(`Kode promo '${dto.nama_diskon}' sudah terdaftar pada tenant ini.`);
    const diskon = await this.prisma.diskon.create({
      data: {
        nama_diskon: dto.nama_diskon.trim(),
        persentase_diskon: dto.persentase_diskon,
        tanggal_awal: new Date(dto.tanggal_awal),
        tanggal_akhir: new Date(dto.tanggal_akhir),
        maker_id: makerId,
      },
    });
    return { message: 'Kode promo baru berhasil ditambahkan.', data: diskon };
  }

  async findOneDiskon(id: number, makerId: number) {
    const diskon = await this.prisma.diskon.findFirst({ where: { id, maker_id: makerId } });
    if (!diskon) throw new NotFoundException(`Diskon dengan ID ${id} tidak ditemukan.`);
    return { message: 'Detail diskon berhasil dimuat.', data: diskon };
  }

  async updateDiskon(id: number, dto: UpdateDiskonDto, makerId: number) {
    await this.findOneDiskon(id, makerId);
    if (dto.nama_diskon) {
      const clash = await this.prisma.diskon.findFirst({
        where: { nama_diskon: dto.nama_diskon.trim(), maker_id: makerId, id: { not: id } },
      });
      if (clash) throw new ConflictException(`Kode promo '${dto.nama_diskon}' sudah dipakai diskon lain.`);
    }
    const { tanggal_awal, tanggal_akhir, ...rest } = dto;
    const diskon = await this.prisma.diskon.update({
      where: { id },
      data: {
        ...rest,
        ...(dto.nama_diskon ? { nama_diskon: dto.nama_diskon.trim() } : {}),
        ...(tanggal_awal ? { tanggal_awal: new Date(tanggal_awal) } : {}),
        ...(tanggal_akhir ? { tanggal_akhir: new Date(tanggal_akhir) } : {}),
      },
    });
    return { message: 'Data diskon berhasil diperbarui.', data: diskon };
  }

  async removeDiskon(id: number, makerId: number) {
    await this.findOneDiskon(id, makerId);
    await this.prisma.diskon.delete({ where: { id } });
    return { message: 'Data diskon berhasil dihapus.', data: { id } };
  }

  // ============ RESERVASI (#42-45) ============
  async findAllReservasi(query: QueryAdminReservasiDto, makerId: number) {
    const where: Prisma.ReservasiWhereInput = { maker_id: makerId };
    if (query.status) where.status = query.status as ReservasiStatus;
    if (query.id_space) where.id_space = query.id_space;
    const tanggal = parseTanggalFilter(query.tanggal);
    if (tanggal) {
      where.tanggal_reservasi = tanggal;
    } else if (query.month || query.year) {
      const now = new Date();
      const y = query.year ?? now.getFullYear();
      const m = query.month ?? now.getMonth() + 1;
      where.tanggal_reservasi = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lt: new Date(Date.UTC(y, m, 1)),
      };
    }
    const reservasis = await this.prisma.reservasi.findMany({
      where,
      include: { member: true, space: true, diskon: true },
      orderBy: { id: 'desc' },
    });
    return { message: 'Daftar reservasi berhasil dimuat.', data: reservasis };
  }

  async updateReservasiStatus(id: number, dto: UpdateReservasiStatusDto, makerId: number) {
    const reservasi = await this.prisma.reservasi.findFirst({ where: { id, maker_id: makerId } });
    if (!reservasi) throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    this.state.validateTransition(reservasi.status, dto.status as ReservasiStatus);
    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: dto.status as ReservasiStatus },
      include: { member: true, space: true, diskon: true },
    });
    return { message: `Status reservasi berhasil diubah menjadi '${dto.status}'.`, data: updated };
  }

  async checkIn(id: number, makerId: number) {
    return this.updateReservasiStatus(id, { status: 'aktif' }, makerId).then((r) => ({
      message: 'Check-in berhasil. Status reservasi menjadi aktif.',
      data: r.data,
    }));
  }

  async checkOut(id: number, makerId: number) {
    return this.updateReservasiStatus(id, { status: 'selesai' }, makerId).then((r) => ({
      message: 'Check-out berhasil. Status reservasi menjadi selesai.',
      data: r.data,
    }));
  }
}
