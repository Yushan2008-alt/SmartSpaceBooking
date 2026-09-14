import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAdminReservasiDto {
  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'month harus berupa angka' })
  @Min(1, { message: 'month minimal 1' })
  @Max(12, { message: 'month maksimal 12' })
  month?: number;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'year harus berupa angka' })
  year?: number;

  @ApiPropertyOptional({ example: 'disetujui', enum: ['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'] })
  @IsOptional()
  @IsIn(['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'], { message: 'status tidak valid' })
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'id_space harus berupa angka' })
  id_space?: number;

  @ApiPropertyOptional({ example: '2026-08-30', description: 'Format YYYY-MM-DD' })
  @IsOptional()
  @IsString({ message: 'tanggal harus berupa string' })
  tanggal?: string;
}

// Reuse for YYYY-MM-DD date validation without pulling reservasi module DTOs.
export function parseTanggalFilter(tanggal?: string): Date | undefined {
  if (!tanggal) return undefined;
  const d = new Date(tanggal.length === 10 ? `${tanggal}T00:00:00.000Z` : tanggal);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}
