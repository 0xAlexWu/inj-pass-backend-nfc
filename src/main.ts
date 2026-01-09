import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';

const server: Express = express();

export const createNextServer = async (expressInstance: any) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // Enable CORS with dynamic origin support
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3001',
        'https://injective-pass.vercel.app'
      ].filter(Boolean);

      // 允许：1. 在允许列表中的域名 2. 本地开发 3. 任何 vercel.app 的预览域名
      if (
        !origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  return app;
};

async function bootstrap() {
  const app = await createNextServer(server);
  await app.init();
  
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  }
}

bootstrap();

export default server;
