import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@Controller()
export class AppController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  getHello() {
    return {
      status: true,
      message: 'Hello World from Smart Space Booking API (Vercel Serverless Ready)!',
      environment: process.env.VERCEL ? 'vercel-serverless' : 'local-development',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: true,
      statusCode: 200,
      message: 'Server is healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-db')
  async testDatabase() {
    try {
      const dbInfo = await this.databaseService.testConnection();
      return {
        status: true,
        message: 'Successfully connected to Supabase PostgreSQL!',
        data: dbInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: false,
        message: 'Failed to connect to database',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('test-cloudinary')
  async testCloudinary() {
    try {
      const uploadResult = await this.cloudinaryService.uploadDummyFile();
      return {
        status: true,
        message: 'Successfully uploaded dummy file to Cloudinary!',
        data: uploadResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: false,
        message: 'Failed to upload to Cloudinary',
        error: error.message || JSON.stringify(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
