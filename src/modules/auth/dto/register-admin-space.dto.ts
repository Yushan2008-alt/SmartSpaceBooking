import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterAdminSpaceDto {
  @ApiProperty({ example: 'admin_moklet', description: 'Username unik login admin lokasi' })
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString({ message: 'Username harus berupa string' })
  username: string;

  @ApiProperty({ example: 'Admin123!', description: 'Kata sandi admin lokasi (min 6 karakter)' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ example: 'Moklet Hub Coworking', description: 'Nama/branding lokasi coworking' })
  @IsNotEmpty({ message: 'Nama coworking wajib diisi' })
  @IsString({ message: 'Nama coworking harus berupa string' })
  nama_coworking: string;

  @ApiProperty({ example: 'Ahmad Bidin', description: 'Nama penanggung jawab operasional' })
  @IsNotEmpty({ message: 'Nama pemilik wajib diisi' })
  @IsString({ message: 'Nama pemilik harus berupa string' })
  nama_pemilik: string;

  @ApiProperty({ example: '081298765432', description: 'Nomor kontak/call center pengelola' })
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @IsString({ message: 'Nomor telepon harus berupa string' })
  telp: string;
}
