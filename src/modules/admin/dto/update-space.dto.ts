import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SpaceTipe } from '@prisma/client';

export class UpdateSpaceDto {
  @ApiPropertyOptional({ example: 'Personal Desk Alpha 01 (Updated)', description: 'Nama spesifik space diperbarui' })
  @IsOptional()
  @IsString()
  nama_space?: string;

  @ApiPropertyOptional({ example: 30000, description: 'Tarif sewa per jam baru (IDR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'harga_per_jam harus berupa angka' })
  @Min(0, { message: 'harga_per_jam tidak boleh negatif' })
  harga_per_jam?: number;

  @ApiPropertyOptional({ enum: SpaceTipe, example: SpaceTipe.desk, description: 'Tipe baru' })
  @IsOptional()
  @IsEnum(SpaceTipe, { message: 'tipe harus salah satu dari: desk, meeting_room, private_office' })
  tipe?: SpaceTipe;

  @ApiPropertyOptional({ example: 2, description: 'Kapasitas maksimal baru' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'kapasitas harus berupa angka' })
  @Min(1, { message: 'kapasitas minimal 1 orang' })
  kapasitas?: number;

  @ApiPropertyOptional({ example: 'Upgrade fasilitas monitor 27 inch 4K', description: 'Deskripsi fasilitas diperbarui' })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'desk_alpha_new.jpg', description: 'Foto baru hasil upload' })
  @IsOptional()
  @IsString()
  foto?: string;
}
