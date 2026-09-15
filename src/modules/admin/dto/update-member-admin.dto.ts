import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMemberAdminDto {
  @ApiPropertyOptional({ example: 'Budi Raharjo, S.T.', description: 'Nama lengkap diperbarui' })
  @IsOptional()
  @IsString()
  nama_member?: string;

  @ApiPropertyOptional({ example: 'PT Teknologi Hebat', description: 'Instansi diperbarui' })
  @IsOptional()
  @IsString()
  instansi?: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 2, Malang', description: 'Alamat domisili baru' })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({ example: '085712345678', description: 'Nomor telepon baru' })
  @IsOptional()
  @IsString()
  telp?: string;

  @ApiPropertyOptional({ example: 'NewSecret123!', description: 'Reset password baru (min 6 karakter)' })
  @IsOptional()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  @ApiPropertyOptional({ example: 'budi_new.jpg', description: 'Nama file foto baru hasil upload' })
  @IsOptional()
  @IsString()
  foto?: string;
}
