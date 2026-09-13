import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterMemberDto {
  @ApiProperty({ example: 'johndoe', description: 'Username unik login member' })
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString({ message: 'Username harus berupa string' })
  username: string;

  @ApiProperty({ example: 'Secret123!', description: 'Kata sandi akun member (min 6 karakter)' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Nama lengkap pelanggan' })
  @IsNotEmpty({ message: 'Nama member wajib diisi' })
  @IsString({ message: 'Nama member harus berupa string' })
  nama_member: string;

  @ApiProperty({ example: 'Universitas Brawijaya / PT Maju', description: 'Asal instansi/kampus/perusahaan' })
  @IsNotEmpty({ message: 'Instansi wajib diisi' })
  @IsString({ message: 'Instansi harus berupa string' })
  instansi: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 123, Malang', description: 'Alamat domisili lengkap' })
  @IsNotEmpty({ message: 'Alamat wajib diisi' })
  @IsString({ message: 'Alamat harus berupa string' })
  alamat: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor telepon aktif / WhatsApp' })
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @IsString({ message: 'Nomor telepon harus berupa string' })
  telp: string;

  @ApiPropertyOptional({ example: 'member_john.jpg', description: 'Nama file hasil upload foto profil' })
  @IsOptional()
  @IsString({ message: 'Foto harus berupa string nama berkas' })
  foto?: string;
}
