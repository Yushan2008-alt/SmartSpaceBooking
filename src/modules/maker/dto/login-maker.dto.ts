import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginMakerDto {
  @ApiProperty({ example: 'budisantoso', description: 'Username atau email siswa terdaftar' })
  @IsNotEmpty({ message: 'Username atau email wajib diisi' })
  @IsString({ message: 'Username atau email harus berupa string' })
  usernameOrEmail: string;

  @ApiProperty({ example: 'Password123!', description: 'Kata sandi akun App Maker' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @IsString({ message: 'Password harus berupa string' })
  password: string;
}
