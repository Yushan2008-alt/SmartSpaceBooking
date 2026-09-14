import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCoworkingProfileDto {
  @ApiProperty({ example: 'Moklet Hub Coworking Space' })
  @IsNotEmpty({ message: 'nama_coworking wajib diisi' })
  @IsString({ message: 'nama_coworking harus berupa string' })
  nama_coworking: string;

  @ApiProperty({ example: 'Ahmad Bidin, S.Kom' })
  @IsNotEmpty({ message: 'nama_pemilik wajib diisi' })
  @IsString({ message: 'nama_pemilik harus berupa string' })
  nama_pemilik: string;

  @ApiProperty({ example: '081298765432' })
  @IsNotEmpty({ message: 'telp wajib diisi' })
  @IsString({ message: 'telp harus berupa string' })
  telp: string;
}
