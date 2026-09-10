import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import dns from 'node:dns';

// Ensure reliable DNS resolution in local development environment
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (_) {}

const server = express();
let isInitialized = false;

export async function bootstrapServer() {
  if (!isInitialized) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
    );
    app.enableCors();
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
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`[NestJS] Server is running locally on http://localhost:${port}`);
  }
  bootstrapLocal();
}
