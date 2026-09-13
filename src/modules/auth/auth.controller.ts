import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterAdminSpaceDto } from './dto/register-admin-space.dto';
import { LoginDto } from './dto/login.dto';
import { MakerAuthGuard } from '../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../common/guards/jwt-user-auth.guard';
import { MakerId } from '../../common/decorators/maker.decorator';
import { CurrentUserId } from '../../common/decorators/user.decorator';

@ApiTags('Autentikasi User')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/member')
  @UseGuards(MakerAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'x-maker-key',
    description: 'App key unik siswa untuk isolasi multi-tenant',
    required: true,
  })
  @ApiOperation({
    summary: 'Registrasi Akun Member / Pelanggan Baru (Endpoint #8)',
    description: 'Mendaftarkan akun baru dengan role "member" di bawah tenant maker.',
  })
  @ApiResponse({ status: 201, description: 'Registrasi member berhasil' })
  @ApiResponse({ status: 409, description: 'Username sudah terdaftar pada tenant' })
  async registerMember(
    @Body() dto: RegisterMemberDto,
    @MakerId() makerId: number,
  ) {
    return this.authService.registerMember(dto, makerId);
  }

  @Post('register/admin-space')
  @UseGuards(MakerAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'x-maker-key',
    description: 'App key unik siswa untuk isolasi multi-tenant',
    required: true,
  })
  @ApiOperation({
    summary: 'Registrasi Pengelola Lokasi / Admin Coworking Space (Endpoint #9)',
    description: 'Mendaftarkan akun baru dengan role "admin_space" beserta data lokasi coworking.',
  })
  @ApiResponse({ status: 201, description: 'Registrasi admin space berhasil' })
  @ApiResponse({ status: 409, description: 'Username sudah terdaftar pada tenant' })
  async registerAdminSpace(
    @Body() dto: RegisterAdminSpaceDto,
    @MakerId() makerId: number,
  ) {
    return this.authService.registerAdminSpace(dto, makerId);
  }

  @Post('login')
  @UseGuards(MakerAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'x-maker-key',
    description: 'App key unik siswa untuk isolasi multi-tenant',
    required: true,
  })
  @ApiOperation({
    summary: 'Login Akun User Member atau Admin Space (Endpoint #10)',
    description: 'Mengembalikan JWT Token dan payload role-aware (member object atau space_owner object).',
  })
  @ApiResponse({ status: 200, description: 'Login berhasil, JWT dikembalikan' })
  @ApiResponse({ status: 401, description: 'Username atau password salah' })
  async login(
    @Body() dto: LoginDto,
    @MakerId() makerId: number,
  ) {
    return this.authService.login(dto, makerId);
  }

  @Get('profile')
  @UseGuards(JwtUserAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cek Profil & Hak Akses Pengguna yang Sedang Login (Endpoint #11)',
    description: 'Melihat identitas, role, dan profil detail (member/admin) dari token aktif.',
  })
  @ApiResponse({ status: 200, description: 'Profil pengguna yang sedang login' })
  @ApiResponse({ status: 401, description: 'Token tidak valid atau belum login' })
  async getProfile(@CurrentUserId() userId: number) {
    return this.authService.getProfile(userId);
  }
}
