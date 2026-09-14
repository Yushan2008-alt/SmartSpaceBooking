import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryQueryDto {
  @ApiPropertyOptional({ example: 8, description: 'Bulan histori (1 - 12)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'month harus berupa angka' })
  @Min(1, { message: 'month minimal bernilai 1' })
  @Max(12, { message: 'month maksimal bernilai 12' })
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Tahun histori (contoh: 2026)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'year harus berupa angka' })
  year?: number;
}
