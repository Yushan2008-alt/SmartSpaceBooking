export interface StoredFileResult {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  kategori: string;
  url: string;
}

export abstract class StorageService {
  abstract saveFile(
    file: Express.Multer.File,
    kategori: string,
    hostUrl?: string,
  ): Promise<StoredFileResult>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
