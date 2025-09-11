import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiService } from 'src/openai/gemini.service';
import { News } from './entities/news.entity';
import { NewsController } from './news.controller';
import { NewsRepository } from './news.repository';
import { NewsService } from './news.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([News]), CloudinaryModule],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository, GeminiService],
  exports: [NewsService, NewsRepository],
})
export class NewsModule {}
