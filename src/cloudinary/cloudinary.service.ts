import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      timeout: 60000,
    });
  }

  async uploadDummyFile(): Promise<{ url: string; public_id: string }> {
    const dummyBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(dummyBase64, {
        folder: 'smart-space/test',
        public_id: `test-${Date.now()}`,
        timeout: 60000,
      });

      this.logger.log(`Dummy file uploaded to Cloudinary: ${result.secure_url}`);
      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error.message || JSON.stringify(error)}`);
      throw error;
    }
  }
}
