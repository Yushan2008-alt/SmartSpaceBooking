import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDiskonDto {
  @ApiPropertyOptional({ example: 'PROMOAGUSTUS2026', description: 'Kode promo diperbarui' })
  @IsOptional()
  @IsString()
  nama_diskon?: string;

  @ApiPropertyOptional({ example: 25, description: 'Persentase diskon potongan baru (1 - 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'persentase_diskon harus berupa angka' })
  @Min(1, { message: 'persentase_diskon minimal 1%' })
  @Max(100, { message: 'persentase_diskon maksimal 100%' })
  persentase_diskon?: number;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00Z', description: 'Tanggal awal baru (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal_awal harus format ISO 8601 yang valid' })
  tanggal_awal?: string;

  @ApiPropertyOptional({ example: '2026-09-15T23:59:59Z', description: 'Tanggal akhir baru (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal_akhir harus format ISO 8601 yang valid' })
  tanggal_akhir?: string;
}
