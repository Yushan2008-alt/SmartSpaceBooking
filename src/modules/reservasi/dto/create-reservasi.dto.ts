import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Matches,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservasiDto {
  @ApiProperty({ example: 1, description: 'ID space / workstation yang dipesan' })
  @IsNotEmpty({ message: 'id_space wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'id_space harus berupa angka' })
  id_space: number;

  @ApiProperty({ example: '2026-08-30', description: 'Tanggal sewa ruangan (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'tanggal_reservasi wajib diisi' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal_reservasi harus YYYY-MM-DD' })
  tanggal_reservasi: string;

  @ApiProperty({ example: '09:00', description: 'Jam mulai sewa (HH:mm format 24 jam)' })
  @IsNotEmpty({ message: 'jam_mulai wajib diisi' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format jam_mulai harus HH:mm (24 jam)' })
  jam_mulai: string;

  @ApiProperty({ example: 3, description: 'Durasi penggunaan dalam satuan jam (minimal 1 jam)' })
  @IsNotEmpty({ message: 'durasi_jam wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'durasi_jam harus berupa angka' })
  @Min(1, { message: 'Durasi sewa minimal 1 jam' })
  durasi_jam: number;

  @ApiPropertyOptional({ example: 1, description: 'ID promo diskon dari katalog (opsional)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'id_diskon harus berupa angka' })
  id_diskon?: number;

  @ApiPropertyOptional({ example: 'DISKONHEMAT20', description: 'Kode promo alternatif input manual (opsional)' })
  @IsOptional()
  @IsString()
  kode_promo?: string;
}
