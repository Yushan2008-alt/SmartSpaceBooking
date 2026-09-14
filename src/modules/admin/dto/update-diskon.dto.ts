import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsDateString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDiskonDto {
  @ApiPropertyOptional({ example: 'PROMOAGUSTUS2026' })
  @IsOptional()
  @IsString({ message: 'nama_diskon harus berupa string' })
  @Matches(/^[A-Z0-9_-]+$/, { message: 'nama_diskon hanya boleh huruf kapital, angka, _ atau - tanpa spasi' })
  nama_diskon?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'persentase_diskon harus berupa angka' })
  @Min(1, { message: 'persentase_diskon minimal 1' })
  @Max(100, { message: 'persentase_diskon maksimal 100' })
  persentase_diskon?: number;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'tanggal_awal harus format tanggal ISO 8601' })
  tanggal_awal?: string;

  @ApiPropertyOptional({ example: '2026-09-15T23:59:59Z' })
  @IsOptional()
  @IsDateString({}, { message: 'tanggal_akhir harus format tanggal ISO 8601' })
  tanggal_akhir?: string;
}
