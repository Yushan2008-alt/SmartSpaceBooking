import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckAvailabilityDto {
  @ApiProperty({ example: 1, description: 'ID ruangan atau workstation yang dicek' })
  @IsNotEmpty({ message: 'id_space wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'id_space harus berupa angka' })
  id_space: number;

  @ApiProperty({ example: '2026-08-30', description: 'Tanggal pemakaian (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'tanggal wajib diisi' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' })
  tanggal: string;

  @ApiProperty({ example: '09:00', description: 'Jam mulai pemakaian (HH:mm format 24 jam)' })
  @IsNotEmpty({ message: 'jam_mulai wajib diisi' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format jam_mulai harus HH:mm (24-jam)' })
  jam_mulai: string;

  @ApiProperty({ example: 3, description: 'Durasi pemakaian dalam satuan jam (min 1)' })
  @IsNotEmpty({ message: 'durasi_jam wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'durasi_jam harus berupa angka' })
  @Min(1, { message: 'Durasi pemakaian minimal 1 jam' })
  durasi_jam: number;
}
