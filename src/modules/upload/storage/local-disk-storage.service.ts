import { Injectable } from '@nestjs/common';
import { StorageService, StoredFileResult } from './storage.interface';
import { extname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

@Injectable()
export class LocalDiskStorageService implements StorageService {
  async saveFile(
    file: Express.Multer.File,
    kategori: string,
    hostUrl?: string,
  ): Promise<StoredFileResult> {
    const dir = `${process.cwd()}/uploads/${kategori}`;
    mkdirSync(dir, { recursive: true });

    const filename = `${kategori}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname).toLowerCase()}`;
    const filePath = `${dir}/${filename}`;

    // Simpan buffer file ke disk lokal
    writeFileSync(filePath, file.buffer);

    const base = hostUrl || 'http://localhost:3000';
    return {
      filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      kategori,
      url: `${base}/uploads/${kategori}/${filename}`,
    };
  }
}
