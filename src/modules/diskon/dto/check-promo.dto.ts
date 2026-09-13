import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckPromoDto {
  @ApiProperty({ example: 'DISKONHEMAT20', description: 'Kode promo yang akan divalidasi' })
  @IsNotEmpty({ message: 'nama_diskon wajib diisi' })
  @IsString({ message: 'nama_diskon harus berupa string' })
  nama_diskon: string;

  @ApiPropertyOptional({
    example: 60000,
    description: 'Total harga transaksi awal untuk menghitung nominal potongan secara otomatis',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'total_harga harus berupa angka' })
  @Min(0, { message: 'total_harga tidak boleh negatif' })
  total_harga?: number;
}
