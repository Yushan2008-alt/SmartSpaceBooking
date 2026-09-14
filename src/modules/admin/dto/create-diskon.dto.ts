import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsDateString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiskonDto {
  @ApiProperty({ example: 'PROMOAGUSTUS', description: 'Kode unik (kapital/angka, tanpa spasi)' })
  @IsNotEmpty({ message: 'nama_diskon wajib diisi' })
  @IsString({ message: 'nama_diskon harus berupa string' })
  @Matches(/^[A-Z0-9_-]+$/, { message: 'nama_diskon hanya boleh huruf kapital, angka, _ atau - tanpa spasi' })
  nama_diskon: string;

  @ApiProperty({ example: 20, description: 'Persentase potongan 1-100' })
  @Type(() => Number)
  @IsNumber({}, { message: 'persentase_diskon harus berupa angka' })
  @Min(1, { message: 'persentase_diskon minimal 1' })
  @Max(100, { message: 'persentase_diskon maksimal 100' })
  persentase_diskon: number;

  @ApiProperty({ example: '2026-08-01T00:00:00Z', description: 'ISO 8601' })
  @IsNotEmpty({ message: 'tanggal_awal wajib diisi' })
  @IsDateString({}, { message: 'tanggal_awal harus format tanggal ISO 8601' })
  tanggal_awal: string;

  @ApiProperty({ example: '2026-08-31T23:59:59Z', description: 'ISO 8601' })
  @IsNotEmpty({ message: 'tanggal_akhir wajib diisi' })
  @IsDateString({}, { message: 'tanggal_akhir harus format tanggal ISO 8601' })
  tanggal_akhir: string;
}
