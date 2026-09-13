import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterMakerDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap siswa peserta ujian' })
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  @IsString({ message: 'Nama lengkap harus berupa string' })
  name: string;

  @ApiProperty({ example: 'budisantoso', description: 'Username unik login App Maker' })
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString({ message: 'Username harus berupa string' })
  username: string;

  @ApiProperty({ example: 'budi@smk.sch.id', description: 'Email unik siswa' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Kata sandi minimal 6 karakter' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;
}
