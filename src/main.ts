import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
config();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['https://taphoaxanh-admin.vercel.app'],
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
    useGlobalPrefix: true,
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
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
