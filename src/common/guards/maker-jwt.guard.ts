import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MakerJwtGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token Bearer Maker tidak ditemukan.');
    }

    const token = authHeader.substring(7);
    const secret =
      this.configService.get<string>('JWT_SECRET_MAKER') || 'smart_space_maker_super_secret_jwt_key_2026';

    try {
      const decoded = jwt.verify(token, secret) as any;
      if (decoded.type !== 'maker') {
        throw new UnauthorizedException('Token ini bukan token App Maker yang valid.');
      }

      const maker = await this.prisma.appMaker.findUnique({
        where: { id: decoded.sub },
      });

      if (!maker) {
        throw new UnauthorizedException('Akun App Maker tidak ditemukan.');
      }

      req.maker = maker;
      req.maker_id = maker.id;
      return true;
    } catch (err) {
      throw new UnauthorizedException(err.message || 'Token App Maker tidak valid atau kadaluarsa.');
    }
  }
}
