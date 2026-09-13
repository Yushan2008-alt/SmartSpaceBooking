import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterMakerDto } from './dto/register-maker.dto';
import { LoginMakerDto } from './dto/login-maker.dto';

@Injectable()
export class MakerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterMakerDto) {
    const existing = await this.prisma.appMaker.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existing) {
      if (existing.username === dto.username) {
        throw new ConflictException('Username sudah digunakan oleh peserta lain.');
      }
      throw new ConflictException('Email sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    // Format app_key: mk_xxxxxxxxxxxxxxxx
    const randomHex = crypto.randomBytes(8).toString('hex');
    const app_key = `mk_${randomHex}`;

    const maker = await this.prisma.appMaker.create({
      data: {
        name: dto.name,
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        app_key,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        app_key: true,
        created_at: true,
      },
    });

    return {
      message: 'Registrasi App Maker berhasil. Simpan app_key Anda dengan baik.',
      data: maker,
    };
  }

  async login(dto: LoginMakerDto) {
    const maker = await this.prisma.appMaker.findFirst({
      where: {
        OR: [{ username: dto.usernameOrEmail }, { email: dto.usernameOrEmail }],
      },
    });

    if (!maker) {
      throw new UnauthorizedException('Username/email atau password salah.');
    }

    const isMatch = await bcrypt.compare(dto.password, maker.password);
    if (!isMatch) {
      throw new UnauthorizedException('Username/email atau password salah.');
    }

    const secret =
      this.configService.get<string>('JWT_SECRET_MAKER') ||
      'smart_space_maker_super_secret_jwt_key_2026';

    const token = jwt.sign(
      {
        sub: maker.id,
        username: maker.username,
        email: maker.email,
        type: 'maker',
      },
      secret,
      { expiresIn: '7d' },
    );

    return {
      message: 'Login App Maker berhasil.',
      data: {
        access_token: token,
        token_type: 'Bearer',
        maker: {
          id: maker.id,
          name: maker.name,
          username: maker.username,
          email: maker.email,
          app_key: maker.app_key,
        },
      },
    };
  }

  async getProfile(makerId: number) {
    const maker = await this.prisma.appMaker.findUnique({
      where: { id: makerId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        app_key: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!maker) {
      throw new NotFoundException('Data App Maker tidak ditemukan.');
    }

    return {
      message: 'Profil App Maker berhasil dimuat.',
      data: maker,
    };
  }

  async getStats(makerId: number) {
    const [totalMembers, totalSpaces, totalDiskons, totalReservasis, incomeAggregate] =
      await Promise.all([
        this.prisma.member.count({ where: { maker_id: makerId } }),
        this.prisma.space.count({ where: { maker_id: makerId } }),
        this.prisma.diskon.count({ where: { maker_id: makerId } }),
        this.prisma.reservasi.count({ where: { maker_id: makerId } }),
        this.prisma.reservasi.aggregate({
          where: {
            maker_id: makerId,
            status: { not: 'dibatalkan' },
          },
          _sum: {
            total_bayar: true,
          },
        }),
      ]);

    return {
      message: 'Statistik data App Maker berhasil dimuat.',
      data: {
        maker_id: makerId,
        total_member: totalMembers,
        total_space: totalSpaces,
        total_diskon: totalDiskons,
        total_reservasi: totalReservasis,
        total_pendapatan: incomeAggregate._sum.total_bayar || 0,
      },
    };
  }

  async listAll() {
    const makers = await this.prisma.appMaker.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        app_key: true,
        created_at: true,
      },
      orderBy: { id: 'asc' },
    });

    return {
      message: 'Daftar semua App Maker terdaftar.',
      data: makers,
    };
  }
}
