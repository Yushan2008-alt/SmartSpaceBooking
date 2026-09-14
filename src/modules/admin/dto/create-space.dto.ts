import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpaceDto {
  @ApiProperty({ example: 'Personal Desk Alpha 01' })
  @IsNotEmpty({ message: 'nama_space wajib diisi' })
  @IsString({ message: 'nama_space harus berupa string' })
  nama_space: string;

  @ApiProperty({ example: 25000, description: 'Tarif sewa per jam (IDR)' })
  @Type(() => Number)
  @IsNumber({}, { message: 'harga_per_jam harus berupa angka' })
  @Min(0, { message: 'harga_per_jam tidak boleh negatif' })
  harga_per_jam: number;

  @ApiProperty({ example: 'desk', enum: ['desk', 'meeting_room', 'private_office'] })
  @IsNotEmpty({ message: 'tipe wajib diisi' })
  @IsIn(['desk', 'meeting_room', 'private_office'], { message: 'tipe harus desk / meeting_room / private_office' })
  tipe: 'desk' | 'meeting_room' | 'private_office';

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber({}, { message: 'kapasitas harus berupa angka' })
  @Min(1, { message: 'kapasitas minimal 1' })
  kapasitas: number;

  @ApiProperty({ example: 'WiFi 100Mbps, stopkontak, coffee' })
  @IsNotEmpty({ message: 'deskripsi wajib diisi' })
  @IsString({ message: 'deskripsi harus berupa string' })
  deskripsi: string;

  @ApiPropertyOptional({ example: 'desk_alpha_01.jpg', description: 'Nama file foto hasil upload' })
  @IsOptional()
  @IsString({ message: 'foto harus berupa string nama berkas' })
  foto?: string;
}
