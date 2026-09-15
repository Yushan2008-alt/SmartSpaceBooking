import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiskonDto {
  @ApiProperty({ example: 'PROMOAGUSTUS', description: 'Kode promo unik (huruf/angka tanpa spasi)' })
  @IsNotEmpty({ message: 'nama_diskon wajib diisi' })
  @IsString()
  nama_diskon: string;

  @ApiProperty({ example: 20, description: 'Persentase diskon potongan (1 - 100)' })
  @IsNotEmpty({ message: 'persentase_diskon wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'persentase_diskon harus berupa angka' })
  @Min(1, { message: 'persentase_diskon minimal 1%' })
  @Max(100, { message: 'persentase_diskon maksimal 100%' })
  persentase_diskon: number;

  @ApiProperty({ example: '2026-08-01T00:00:00Z', description: 'Tanggal mulai berlaku (ISO 8601)' })
  @IsNotEmpty({ message: 'tanggal_awal wajib diisi' })
  @IsDateString({}, { message: 'Format tanggal_awal harus format ISO 8601 yang valid' })
  tanggal_awal: string;

  @ApiProperty({ example: '2026-08-31T23:59:59Z', description: 'Tanggal berakhir berlaku (ISO 8601)' })
  @IsNotEmpty({ message: 'tanggal_akhir wajib diisi' })
  @IsDateString({}, { message: 'Format tanggal_akhir harus format ISO 8601 yang valid' })
  tanggal_akhir: string;
}
