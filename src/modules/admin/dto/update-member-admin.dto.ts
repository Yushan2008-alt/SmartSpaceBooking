import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMemberAdminDto {
  @ApiPropertyOptional({ example: 'Budi Raharjo, S.T.' })
  @IsOptional()
  @IsString({ message: 'nama_member harus berupa string' })
  nama_member?: string;

  @ApiPropertyOptional({ example: 'PT Teknologi Hebat' })
  @IsOptional()
  @IsString({ message: 'instansi harus berupa string' })
  instansi?: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 2, Malang' })
  @IsOptional()
  @IsString({ message: 'alamat harus berupa string' })
  alamat?: string;

  @ApiPropertyOptional({ example: '085712345678' })
  @IsOptional()
  @IsString({ message: 'telp harus berupa string' })
  telp?: string;

  @ApiPropertyOptional({ example: 'NewSecret123!', description: 'Reset password baru (min 6 karakter)' })
  @IsOptional()
  @IsString({ message: 'password harus berupa string' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  @ApiPropertyOptional({ example: 'budi_new.jpg' })
  @IsOptional()
  @IsString({ message: 'foto harus berupa string nama berkas' })
  foto?: string;
}
