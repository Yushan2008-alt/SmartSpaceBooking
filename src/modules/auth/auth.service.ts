import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterAdminSpaceDto } from './dto/register-admin-space.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async registerMember(dto: RegisterMemberDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('Username sudah terdaftar.');
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
      include: {
        member: true,
      },
    });

    const { password, ...safeUser } = user;
    return {
      message: 'Registrasi Member berhasil.',
      data: safeUser,
    };
  }

  async registerAdminSpace(dto: RegisterAdminSpaceDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('Username sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        role: Role.admin_space,
        spaceOwner: {
          create: {
            nama_coworking: dto.nama_coworking,
            nama_pemilik: dto.nama_pemilik,
            telp: dto.telp,
          },
        },
      },
      include: {
        spaceOwner: true,
      },
    });

    const { password, ...safeUser } = user;
    return {
      message: 'Registrasi Admin Space berhasil.',
      data: safeUser,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        member: true,
        spaceOwner: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Username atau kata sandi tidak valid.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Username atau kata sandi tidak valid.');
    }

    const secret =
      this.configService.get<string>('JWT_SECRET_USER') ||
      'smart_space_user_super_secret_jwt_key_2026';

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' },
    );

    return {
      message: 'Login berhasil.',
      data: {
        access_token: token,
        token_type: 'Bearer',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        member: user.member || null,
        space_owner: user.spaceOwner || null,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
        spaceOwner: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const { password, ...safeUser } = user;
    return {
      message: 'Profil pengguna berhasil dimuat.',
      data: safeUser,
    };
  }
}
