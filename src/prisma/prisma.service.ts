import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Resilient connection string handling for local DNS
    const rawUrl = process.env.DATABASE_URL || '';
    let dbUrl =
      rawUrl.includes('aws-0-ap-southeast-1.pooler.supabase.com') && !process.env.VERCEL
        ? rawUrl.replace('aws-0-ap-southeast-1.pooler.supabase.com:6543', '52.77.146.31:5432') +
          '&sslaccept=accept_invalid_certs'
        : rawUrl;

    if (dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=true')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }

    super({
      datasources: { db: { url: dbUrl } },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma Client connected to database successfully.');
    } catch (err) {
      this.logger.error(`Prisma connection error: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
