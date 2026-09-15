import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateMemberAdminDto {
  @ApiProperty({ example: 'user_budi', description: 'Username unik login member' })
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'Secret123!', description: 'Password akun member baru (min 6 karakter)' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ example: 'Budi Raharjo', description: 'Nama lengkap pelanggan' })
  @IsNotEmpty({ message: 'nama_member wajib diisi' })
  @IsString()
  nama_member: string;

  @ApiProperty({ example: 'SMK Telkom Malang', description: 'Asal instansi/organisasi' })
  @IsNotEmpty({ message: 'instansi wajib diisi' })
  @IsString()
  instansi: string;

  @ApiProperty({ example: 'Jl. Danau Ranau No. 1, Malang', description: 'Alamat domisili lengkap' })
  @IsNotEmpty({ message: 'alamat wajib diisi' })
  @IsString()
  alamat: string;

  @ApiProperty({ example: '085712345678', description: 'Nomor telepon aktif' })
  @IsNotEmpty({ message: 'telp wajib diisi' })
  @IsString()
  telp: string;

  @ApiPropertyOptional({ example: 'budi_raharjo.jpg', description: 'Nama file foto profil hasil upload' })
  @IsOptional()
  @IsString()
  foto?: string;
}
