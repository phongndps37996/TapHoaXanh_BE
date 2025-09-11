import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { GeminiService } from 'src/openai/gemini.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { PaginatedNewsDto } from './dto/paginated-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News } from './entities/news.entity';
import { NewsRepository } from './news.repository';
import { ICloudinaryService } from 'src/cloudinary/interfaces/icloudinary-service.interface';

@Injectable()
export class NewsService {
  constructor(
    private readonly newsRepository: NewsRepository,
    private readonly geminiService: GeminiService,
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async generateDescription(title: string): Promise<string> {
    return this.geminiService.generateArticle(title);
  }
  async create(createNewsDto: CreateNewsDto, images: Express.Multer.File[]): Promise<News> {
    try {
      const news = this.newsRepository.create(createNewsDto);
      // Gọi upload file
      const cloudinaryResult = await this.cloudinaryService.uploadMultipleFiles(images, {
        fileType: 'news',
      });

      if (!cloudinaryResult || !Array.isArray(cloudinaryResult)) {
        throw new InternalServerErrorException('Upload ảnh thất bại');
      }

      news.images = cloudinaryResult.map((file) => file.url);

      return await this.newsRepository.save(news);
    } catch (error) {
      console.error('Lỗi khi tạo bài viết mới:', error);
      throw new BadRequestException('Không thể tạo bài viết mới');
    }
  }

  async findAll(): Promise<News[]> {
    return this.newsRepository.findAllWithRelations();
  }

  async findWithPagination(queryDto: QueryNewsDto): Promise<PaginatedNewsDto> {
    return this.newsRepository.findWithPagination(queryDto);
  }

  async findOne(id: number): Promise<News> {
    const news = await this.newsRepository.findById(id);
    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
    }
    return news;
  }

  async update(id: number, updateNewsDto: UpdateNewsDto, images?: Express.Multer.File[]): Promise<News> {
    const existingNews = await this.findOne(id);
    const updatedNews = this.newsRepository.create({ ...existingNews, ...updateNewsDto });

    const oldImages = existingNews.images || [];
    console.log('🚀 ~ NewsService ~ update ~ oldImages:', oldImages);
    const clientImagesRaw = updateNewsDto.images || [];
    const clientImages: string[] = Array.isArray(clientImagesRaw)
      ? clientImagesRaw
      : typeof clientImagesRaw === 'string'
        ? JSON.parse(clientImagesRaw)
        : [];

    console.log('🚀 clientImages:', clientImages);

    // 1. Xác định và xoá ảnh không còn dùng
    const imagesToDelete = await this.getImagesToDelete(oldImages, clientImages);
    console.log('🚀 ~ NewsService ~ update ~ imagesToDelete:', imagesToDelete);
    if (imagesToDelete.length > 0) await this.deleteImages(imagesToDelete);

    // 2. Kiểm tra các ảnh cũ có được giữ lại không
    let finalImages = clientImages.filter((img) => oldImages.includes(img));

    // 3. Upload ảnh mới nếu có
    const newUploadedUrls = await this.uploadNewImages(images || []);
    finalImages = [...finalImages, ...newUploadedUrls];

    updatedNews.images = finalImages;

    return this.newsRepository.save(updatedNews);
  }

  async getImagesToDelete(oldImages: string[], clientImages: string[]): Promise<string[]> {
    // Trả vè danh sách các ảnh mà client không còn giữ lại
    return oldImages.filter((img) => !clientImages.includes(img));
  }

  async deleteImages(imagesToDelete: string[]): Promise<void> {
    if (imagesToDelete.length === 0) return;

    await this.cloudinaryService.deleteMultipleFiles(imagesToDelete);
  }

  async uploadNewImages(images: Express.Multer.File[]): Promise<string[]> {
    if (!images || images.length === 0) return [];

    const cloudinaryResult = await this.cloudinaryService.uploadMultipleFiles(images, {
      fileType: 'news',
    });

    if (!cloudinaryResult || !Array.isArray(cloudinaryResult)) {
      throw new InternalServerErrorException('Upload ảnh thất bại');
    }

    return cloudinaryResult.map((file) => file.url);
  }

  async remove(id: number): Promise<void> {
    const existingNews = await this.newsRepository.findById(id);
    if (!existingNews) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
    }

    await this.newsRepository.delete(id);
  }

  async incrementViews(id: number): Promise<News> {
    await this.newsRepository.incrementViews(id);
    return this.findOne(id);
  }

  async likeNews(id: number): Promise<News> {
    await this.findOne(id); // Verify news exists
    await this.newsRepository.incrementLikes(id);
    return this.findOne(id);
  }

  async unlikeNews(id: number): Promise<News> {
    const news = await this.findOne(id);
    if ((news.likes ?? 0) > 0) {
      // dùng ?? để fallback về 0 nếu undefined
      await this.newsRepository.decrementLikes(id);
    }
    return this.findOne(id);
  }

  async findByType(type: string): Promise<News[]> {
    return this.newsRepository.findByType(type);
  }

  async findPopular(limit: number = 10): Promise<News[]> {
    return this.newsRepository.findPopular(limit);
  }

  async findRecent(limit: number = 10): Promise<News[]> {
    return this.newsRepository.findRecent(limit);
  }
}
