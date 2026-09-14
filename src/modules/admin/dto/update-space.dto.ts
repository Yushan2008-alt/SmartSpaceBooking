import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSpaceDto {
  @ApiPropertyOptional({ example: 'Personal Desk Alpha 01 (Updated)' })
  @IsOptional()
  @IsString({ message: 'nama_space harus berupa string' })
  nama_space?: string;

  @ApiPropertyOptional({ example: 30000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'harga_per_jam harus berupa angka' })
  @Min(0, { message: 'harga_per_jam tidak boleh negatif' })
  harga_per_jam?: number;

  @ApiPropertyOptional({ example: 'desk', enum: ['desk', 'meeting_room', 'private_office'] })
  @IsOptional()
  @IsIn(['desk', 'meeting_room', 'private_office'], { message: 'tipe harus desk / meeting_room / private_office' })
  tipe?: 'desk' | 'meeting_room' | 'private_office';

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'kapasitas harus berupa angka' })
  @Min(1, { message: 'kapasitas minimal 1' })
  kapasitas?: number;

  @ApiPropertyOptional({ example: 'Fasilitas upgrade monitor 27 inch 4K' })
  @IsOptional()
  @IsString({ message: 'deskripsi harus berupa string' })
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'desk_alpha_new.jpg' })
  @IsOptional()
  @IsString({ message: 'foto harus berupa string nama berkas' })
  foto?: string;
}
