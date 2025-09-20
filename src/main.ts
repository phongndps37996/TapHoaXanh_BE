import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
config();

let app: any;

async function bootstrap() {
  app = await NestFactory.create(AppModule);

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

  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT ?? 5000);
  } else {
    await app.init();
  }
}

// Export handler function cho Vercel
export const handler = async (req: any, res: any) => {
  if (!app) {
    await bootstrap();
  }
  return app.getHttpAdapter().getInstance()(req, res);
};

// Cho môi trường development local
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
