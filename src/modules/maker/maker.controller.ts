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
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { MakerService } from './maker.service';
import { RegisterMakerDto } from './dto/register-maker.dto';
import { LoginMakerDto } from './dto/login-maker.dto';
import { MakerJwtGuard } from '../../common/guards/maker-jwt.guard';
import { MakerId } from '../../common/decorators/maker.decorator';

@ApiTags('Multi-Tenancy (App Maker)')
@Controller('api/maker')
export class MakerController {
  constructor(private readonly makerService: MakerService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrasi Akun Siswa / App Maker (Endpoint #3)',
    description: 'Mendapatkan App Key unik (format: mk_xxx) untuk isolasi data multi-tenancy.',
  })
  @ApiResponse({ status: 201, description: 'Pendaftaran App Maker berhasil' })
  @ApiResponse({ status: 409, description: 'Username atau email sudah digunakan' })
  async register(@Body() dto: RegisterMakerDto) {
    return this.makerService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login Akun Siswa / App Maker (Endpoint #4)',
    description: 'Login untuk mendapatkan access token Maker JWT.',
  })
  @ApiResponse({ status: 200, description: 'Login berhasil, token Maker dikembalikan' })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid' })
  async login(@Body() dto: LoginMakerDto) {
    return this.makerService.login(dto);
  }

  @Get('me')
  @UseGuards(MakerJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lihat Profil & App Key Siswa Saat Ini (Endpoint #5)',
    description: 'Menampilkan detail profil Maker dari Bearer token aktif.',
  })
  @ApiResponse({ status: 200, description: 'Profil App Maker' })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  async getProfile(@MakerId() makerId: number) {
    return this.makerService.getProfile(makerId);
  }

  @Get('stats')
  @UseGuards(MakerJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Statistik Keseluruhan Data Siswa (Endpoint #6)',
    description: 'Menghitung total member, space, diskon, reservasi, dan estimasi pendapatan tenant sendiri.',
  })
  @ApiResponse({ status: 200, description: 'Statistik agregat tenant' })
  async getStats(@MakerId() makerId: number) {
    return this.makerService.getStats(makerId);
  }

  @Get('list')
  @ApiOperation({
    summary: 'Daftar Semua Siswa / App Maker Terdaftar (Endpoint #7)',
    description: 'Publik untuk guru / penguji UKK melihat daftar seluruh peserta.',
  })
  @ApiResponse({ status: 200, description: 'Daftar semua peserta UKK' })
  async listAll() {
    return this.makerService.listAll();
  }
}
