import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { MakerModule } from './modules/maker/maker.module';
import { AuthModule } from './modules/auth/auth.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { DiskonModule } from './modules/diskon/diskon.module';
import { ReservasiModule } from './modules/reservasi/reservasi.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UploadModule } from './modules/upload/upload.module';
import { PrismaModule } from './prisma/prisma.module';
import { join } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MakerModule,
    AuthModule,
    SpacesModule,
    DiskonModule,
    ReservasiModule,
    AdminModule,
    ReportsModule,
    UploadModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService, CloudinaryService],
  exports: [DatabaseService, CloudinaryService],
})
export class AppModule {}

