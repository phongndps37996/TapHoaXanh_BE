import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

config();

let cachedApp: any;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      'https://taphoaxanh-admin.vercel.app',
      'https://taphoaxanh.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'Accept', 'Authorization', 'X-Custom-Header'],
    exposedHeaders: ['Authorization'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Tên API')
    .setDescription('Mô tả API')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();
  const document = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    useGlobalPrefix: false,
    jsonDocumentUrl: 'swagger/json',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
    customSiteTitle: 'API Documentation',
  });

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

// Export handler for Vercel
export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  return app(req, res);
}

// For local development
console.log('NODE_ENV:', process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') {
  console.log('Starting in development mode...');
  bootstrap().then((app) => {
    app.listen(process.env.PORT ?? 4000, () => {
      console.log(`Application is running on: http://localhost:${process.env.PORT ?? 4000}`);
    });
  });
} else {
  console.log('Starting in production mode (Vercel)...');
}
