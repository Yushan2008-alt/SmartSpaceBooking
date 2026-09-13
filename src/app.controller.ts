import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from './database/database.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@ApiTags('Root & Health')
@Controller()
export class AppController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Status API & Petunjuk Penggunaan (Endpoint #1)' })
  @ApiResponse({ status: 200, description: 'Informasi status API dan panduan penggunaan' })
  getRoot() {
    return {
      name: 'Smart Space Booking API',
      version: '1.0.0',
      description: 'REST API Sistem Reservasi Coworking Space & Workstation — UKK RPL 2026/2027 (Paket B)',
      docs: '/docs',
      environment: process.env.VERCEL ? 'vercel-serverless' : 'local-development',
      instructions: {
        step_1: 'Daftarkan akun App Maker di POST /api/maker/register untuk mendapatkan x-maker-key.',
        step_2: 'Sertakan header x-maker-key: <app_key> pada seluruh request data untuk isolasi multi-tenant.',
        step_3: 'Daftarkan Member atau Admin Space di POST /api/auth/register/* lalu login di POST /api/auth/login.',
        step_4: 'Sertakan header Authorization: Bearer <access_token> untuk endpoint terproteksi.',
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health Check Server (Endpoint #2)' })
  @ApiResponse({ status: 200, description: 'Server berjalan dengan normal' })
  getHealth() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-db')
  @ApiOperation({ summary: 'Uji Koneksi Supabase PostgreSQL' })
  async testDatabase() {
    const dbInfo = await this.databaseService.testConnection();
    return {
      message: 'Successfully connected to Supabase PostgreSQL!',
      db: dbInfo,
    };
  }

  @Get('test-cloudinary')
  @ApiOperation({ summary: 'Uji Upload Cloudinary' })
  async testCloudinary() {
    const uploadResult = await this.cloudinaryService.uploadDummyFile();
    return {
      message: 'Successfully uploaded dummy file to Cloudinary!',
      cloudinary: uploadResult,
    };
  }
}
