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

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
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
