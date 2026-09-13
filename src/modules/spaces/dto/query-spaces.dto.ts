import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SpaceTipe } from '@prisma/client';

export class QuerySpacesDto {
  @ApiPropertyOptional({
    enum: SpaceTipe,
    description: 'Filter berdasarkan tipe: desk | meeting_room | private_office',
  })
  @IsOptional()
  @IsEnum(SpaceTipe, { message: 'Tipe space harus salah satu dari: desk, meeting_room, private_office' })
  tipe?: SpaceTipe;

  @ApiPropertyOptional({
    example: 'Alpha',
    description: 'Pencarian kata kunci pada nama atau deskripsi space',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
