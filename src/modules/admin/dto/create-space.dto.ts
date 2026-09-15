import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { SpaceTipe } from '@prisma/client';

export class CreateSpaceDto {
  @ApiProperty({ example: 'Personal Desk Alpha 01', description: 'Nama spesifik space/ruangan/meja' })
  @IsNotEmpty({ message: 'nama_space wajib diisi' })
  @IsString()
  nama_space: string;

  @ApiProperty({ example: 25000, description: 'Tarif sewa per jam (IDR)' })
  @IsNotEmpty({ message: 'harga_per_jam wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'harga_per_jam harus berupa angka' })
  @Min(0, { message: 'harga_per_jam tidak boleh negatif' })
  harga_per_jam: number;

  @ApiProperty({ enum: SpaceTipe, example: SpaceTipe.desk, description: 'desk | meeting_room | private_office' })
  @IsNotEmpty({ message: 'tipe wajib diisi' })
  @IsEnum(SpaceTipe, { message: 'tipe harus salah satu dari: desk, meeting_room, private_office' })
  tipe: SpaceTipe;

  @ApiProperty({ example: 1, description: 'Kapasitas maksimal orang' })
  @IsNotEmpty({ message: 'kapasitas wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'kapasitas harus berupa angka' })
  @Min(1, { message: 'kapasitas minimal 1 orang' })
  kapasitas: number;

  @ApiProperty({ example: 'WiFi 100Mbps, Stopkontak individual, Free flow coffee', description: 'Rincian fasilitas ruangan' })
  @IsNotEmpty({ message: 'deskripsi wajib diisi' })
  @IsString()
  deskripsi: string;

  @ApiPropertyOptional({ example: 'desk_alpha_01.jpg', description: 'Nama file foto space hasil upload' })
  @IsOptional()
  @IsString()
  foto?: string;
}
