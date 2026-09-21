import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import dns from 'node:dns';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Ensure reliable DNS resolution in local development environment
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (_) {}

const server = express();
let isInitialized = false;

function setupApp(app: NestExpressApplication) {
  app.enableCors();
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Smart Space Booking API')
    .setDescription(
      'REST API Backend untuk Sistem Reservasi Coworking Space & Workstation — UKK RPL Paket B 2026/2027',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const SWAGGER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2';
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Smart Space Booking API Docs',
    customfavIcon:
      'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏢</text></svg>',
    customCssUrl: [`${SWAGGER_CDN}/swagger-ui.min.css`],
    customJs: [
      `${SWAGGER_CDN}/swagger-ui-bundle.min.js`,
      `${SWAGGER_CDN}/swagger-ui-standalone-preset.min.js`,
    ],
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
    `,
  });
}

export async function bootstrapServer() {
  if (!isInitialized) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server));
    setupApp(app);
    await app.init();
    isInitialized = true;
  }
  return server;
}

// Handler exported for Vercel Serverless Functions
export default async function handler(req: Request, res: Response) {
  await bootstrapServer();
  server(req, res);
}

// Run locally when not in Vercel environment
if (!process.env.VERCEL) {
  async function bootstrapLocal() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    setupApp(app);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`[NestJS] Server is running locally on http://localhost:${port}`);
    console.log(`[Swagger] Documentation available at http://localhost:${port}/docs`);
  }
  bootstrapLocal();
}
