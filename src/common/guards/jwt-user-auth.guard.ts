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
export class JwtUserAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token diperlukan (Bearer <token>).');
    }

    const token = authHeader.substring(7);
    const secret =
      this.configService.get<string>('JWT_SECRET_USER') || 'smart_space_user_super_secret_jwt_key_2026';

    try {
      const decoded = jwt.verify(token, secret) as any;
      
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          member: true,
          spaceOwner: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Pengguna tidak ditemukan atau sudah tidak aktif.');
      }

      req.user = user;
      req.user_id = user.id;
      req.user_role = user.role;
      req.maker_id = user.maker_id;

      return true;
    } catch (err) {
      throw new UnauthorizedException(err.message || 'Token tidak valid atau telah kadaluarsa.');
    }
  }
}
