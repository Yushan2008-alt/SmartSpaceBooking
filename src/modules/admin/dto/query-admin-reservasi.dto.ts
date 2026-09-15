import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservasiStatus } from '@prisma/client';

export class QueryAdminReservasiDto {
  @ApiPropertyOptional({ example: 8, description: 'Filter bulan (1 - 12)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Filter tahun (contoh: 2026)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({
    enum: ReservasiStatus,
    example: ReservasiStatus.belum_dikonfirm,
    description: 'Filter status reservasi: belum_dikonfirm | disetujui | aktif | selesai | dibatalkan',
  })
  @IsOptional()
  @IsEnum(ReservasiStatus)
  status?: ReservasiStatus;

  @ApiPropertyOptional({ example: 1, description: 'Filter berdasarkan ID space spesifik' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_space?: number;

  @ApiPropertyOptional({ example: '2026-08-30', description: 'Filter tanggal reservasi (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' })
  tanggal?: string;
}
