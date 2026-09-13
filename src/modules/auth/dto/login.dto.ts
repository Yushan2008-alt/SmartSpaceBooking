import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'johndoe', description: 'Username pengguna (Member atau Admin Space)' })
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString({ message: 'Username harus berupa string' })
  username: string;

  @ApiProperty({ example: 'Secret123!', description: 'Kata sandi pengguna' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @IsString({ message: 'Password harus berupa string' })
  password: string;
}
