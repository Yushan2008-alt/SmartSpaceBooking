import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MakerAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const appKey = req.headers['x-maker-key'] || req.headers['x-app-key'];

    if (!appKey || typeof appKey !== 'string') {
      throw new UnauthorizedException(
        'Header x-maker-key (atau x-app-key) wajib disertakan untuk mengakses API ini.',
      );
    }

    const maker = await this.prisma.appMaker.findUnique({
      where: { app_key: appKey.trim() },
    });

    if (!maker) {
      throw new UnauthorizedException(
        'App key tidak valid. Daftarkan akun maker di POST /api/maker/register.',
      );
    }

    // Inject maker details into request
    req.maker = maker;
    req.maker_id = maker.id;

    return true;
  }
}
