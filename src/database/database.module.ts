import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        url: process.env.DATABASE_URL, // từ Vercel env
        autoLoadEntities: true,
        synchronize: true, // chỉ bật ở dev
        ssl: {
          rejectUnauthorized: false, // Aiven yêu cầu SSL
        },
        // migrations: ['dist/src/migrations/*.js'],
        // migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
