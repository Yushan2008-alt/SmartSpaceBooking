import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateReservasiStatusDto {
  @ApiProperty({
    example: 'disetujui',
    enum: ['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'],
  })
  @IsNotEmpty({ message: 'status wajib diisi' })
  @IsIn(['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'], {
    message: 'status harus salah satu dari belum_dikonfirm / disetujui / aktif / selesai / dibatalkan',
  })
  status: 'belum_dikonfirm' | 'disetujui' | 'aktif' | 'selesai' | 'dibatalkan';
}
