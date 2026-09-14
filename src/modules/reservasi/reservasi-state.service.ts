import { Injectable, BadRequestException } from '@nestjs/common';
import { ReservasiStatus } from '@prisma/client';

// ponytail: centralized state machine definition for reservation lifecycle
export const VALID_TRANSITIONS: Record<ReservasiStatus, ReservasiStatus[]> = {
  [ReservasiStatus.belum_dikonfirm]: [
    ReservasiStatus.disetujui,
    ReservasiStatus.dibatalkan,
  ],
  [ReservasiStatus.disetujui]: [
    ReservasiStatus.aktif,
    ReservasiStatus.dibatalkan,
  ],
  [ReservasiStatus.aktif]: [
    ReservasiStatus.selesai,
  ],
  [ReservasiStatus.selesai]: [],
  [ReservasiStatus.dibatalkan]: [],
};

@Injectable()
export class ReservasiStateService {
  canTransition(from: ReservasiStatus, to: ReservasiStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  validateTransition(from: ReservasiStatus, to: ReservasiStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Perubahan status tidak diizinkan: dari '${from}' ke '${to}'. Alur yang sah: belum_dikonfirm -> disetujui -> aktif -> selesai. Pembatalan hanya bisa dari belum_dikonfirm atau disetujui.`,
      );
    }
  }
}
