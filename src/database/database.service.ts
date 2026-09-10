import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const rawUrl = this.configService.get<string>('DATABASE_URL');
    const isVercel = !!process.env.VERCEL;

    let poolConfig: PoolConfig;

    if (isVercel) {
      // In Vercel serverless environment, use standard connection string
      let connectionString = rawUrl || '';
      if (connectionString.includes('G+NKwY$.ds5U&QK')) {
        connectionString = connectionString.replace('G+NKwY$.ds5U&QK', 'G%2BNKwY%24.ds5U%26QK');
      }
      connectionString = connectionString.replace('?sslmode=require', '').replace('&sslmode=require', '');

      poolConfig = {
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 10000,
        max: 2, // Low connection limit for serverless functions
      };
    } else {
      // In local development, bypass local ISP DNS instability using direct Pooler IP + SNI
      poolConfig = {
        host: '52.77.146.31', // aws-0-ap-southeast-1.pooler.supabase.com
        port: 6543,
        user: 'postgres.gbzzsynadnsspotdnzts',
        password: 'G+NKwY$.ds5U&QK',
        database: 'postgres',
        ssl: {
          rejectUnauthorized: false,
          servername: 'aws-0-ap-southeast-1.pooler.supabase.com',
        },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 10000,
        max: 5,
      };
    }

    this.pool = new Pool(poolConfig);
  }

  async onModuleInit() {
    try {
      const res = await this.query('SELECT NOW() as now');
      this.logger.log(`Database connected successfully at: ${res.rows[0].now}`);
    } catch (err) {
      this.logger.error(`Failed to connect to database: ${err.message}`);
    }
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async testConnection() {
    const res = await this.query('SELECT NOW() as current_time, version() as db_version');
    return res.rows[0];
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
