import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';

describe('AppController', () => {
  let app: TestingModule;
  let appController: AppController;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
      controllers: [AppController],
      providers: [AppService, DatabaseService, CloudinaryService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('root', () => {
    it('should return API info', () => {
      const root = appController.getRoot();
      expect(root.name).toBe('Smart Space Booking API');
      expect(root.docs).toBe('/docs');
    });
  });

  describe('health', () => {
    it('should return UP status', () => {
      const health = appController.getHealth();
      expect(health.status).toBe('UP');
    });
  });
});
