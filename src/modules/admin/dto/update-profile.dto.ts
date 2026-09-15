import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCoworkingProfileDto {
  @ApiPropertyOptional({ example: 'Moklet Hub Coworking Space', description: 'Nama/branding lokasi coworking' })
  @IsOptional()
  @IsString()
  nama_coworking?: string;

  @ApiPropertyOptional({ example: 'Ahmad Bidin, S.Kom', description: 'Nama penanggung jawab operasional' })
  @IsOptional()
  @IsString()
  nama_pemilik?: string;

  @ApiPropertyOptional({ example: '081298765432', description: 'Nomor telepon/call center pengelola' })
  @IsOptional()
  @IsString()
  telp?: string;
}
