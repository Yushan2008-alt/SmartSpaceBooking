import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { ReservasiStatus } from '@prisma/client';

export class UpdateReservasiStatusDto {
  @ApiProperty({
    enum: ReservasiStatus,
    example: ReservasiStatus.disetujui,
    description: 'Status baru: belum_dikonfirm | disetujui | aktif | selesai | dibatalkan',
  })
  @IsNotEmpty({ message: 'status wajib diisi' })
  @IsEnum(ReservasiStatus, {
    message: 'status harus salah satu dari: belum_dikonfirm, disetujui, aktif, selesai, dibatalkan',
  })
  status: ReservasiStatus;
}
