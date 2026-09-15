import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { UpdateCoworkingProfileDto } from '../dto/update-profile.dto';
import { MakerAuthGuard } from '../../../common/guards/maker-auth.guard';
import { JwtUserAuthGuard } from '../../../common/guards/jwt-user-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { MakerId } from '../../../common/decorators/maker.decorator';
import { CurrentUserId } from '../../../common/decorators/user.decorator';

@ApiTags('Profil Lokasi (Admin)')
@Controller('api/admin/profile')
@UseGuards(MakerAuthGuard, JwtUserAuthGuard, RolesGuard)
@Roles('admin_space')
@ApiHeader({
  name: 'x-maker-key',
  description: 'App key unik siswa untuk isolasi multi-tenant',
  required: true,
})
@ApiBearerAuth('JWT-auth')
export class AdminProfileController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Lihat Data Profil Lokasi Coworking Space (Endpoint #25)',
    description: 'Menampilkan rincian data coworking milik admin space.',
  })
  @ApiResponse({ status: 200, description: 'Profil coworking space berhasil dimuat' })
  getProfile(@CurrentUserId() userId: number, @MakerId() makerId: number) {
    return this.adminService.getProfile(userId, makerId);
  }

  @Put()
  @ApiOperation({
    summary: 'Update Data Profil Lokasi Coworking Space (Endpoint #26)',
    description: 'Memperbarui informasi nama coworking, nama pemilik, dan nomor telepon pengelola.',
  })
  @ApiResponse({ status: 200, description: 'Profil coworking space berhasil diperbarui' })
  updateProfile(
    @CurrentUserId() userId: number,
    @MakerId() makerId: number,
    @Body() dto: UpdateCoworkingProfileDto,
  ) {
    return this.adminService.updateProfile(userId, makerId, dto);
  }
}
