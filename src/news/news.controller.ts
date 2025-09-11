import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNewsDto } from './dto/create-news.dto';
import { PaginatedNewsDto } from './dto/paginated-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News } from './entities/news.entity';
import { NewsService } from './news.service';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({ status: 201, description: 'Bài viết đã được tạo thành công', type: News })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @UseInterceptors(FilesInterceptor('images'))
  create(@Body() createNewsDto: CreateNewsDto, @UploadedFiles() files: Express.Multer.File[]): Promise<News> {
    return this.newsService.create(createNewsDto, files);
  }

  @Post('generate-description')
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  generateDescription(@Body('name') name: string) {
    return this.newsService.generateDescription(name);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả bài viết' })
  @ApiResponse({ status: 200, description: 'Danh sách tất cả bài viết', type: [News] })
  findAll(): Promise<News[]> {
    return this.newsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm bài viết với phân trang' })
  @ApiResponse({ status: 200, description: 'Kết quả tìm kiếm bài viết', type: PaginatedNewsDto })
  search(@Query() queryDto: QueryNewsDto): Promise<PaginatedNewsDto> {
    return this.newsService.findWithPagination(queryDto);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Lấy bài viết phổ biến' })
  @ApiQuery({ name: 'limit', description: 'Số lượng bài viết', example: 10, required: false })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết phổ biến', type: [News] })
  findPopular(@Query('limit') limit?: number): Promise<News[]> {
    return this.newsService.findPopular(limit);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Lấy bài viết mới nhất' })
  @ApiQuery({ name: 'limit', description: 'Số lượng bài viết', example: 10, required: false })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết mới nhất', type: [News] })
  findRecent(@Query('limit') limit?: number): Promise<News[]> {
    return this.newsService.findRecent(limit);
  }

  @Get('type')
  @ApiOperation({ summary: 'Lấy bài viết theo loại' })
  @ApiQuery({ name: 'type', description: 'Loại bài viết', example: 'news' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết theo loại', type: [News] })
  findByType(@Query('type') type: string): Promise<News[]> {
    return this.newsService.findByType(type);
  }

  @Get('/detail/:id')
  @ApiOperation({ summary: 'Lấy bài viết theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết bài viết', type: News })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<News> {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiResponse({ status: 200, description: 'Bài viết đã được cập nhật', type: News })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @UseInterceptors(FilesInterceptor('images'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewsDto: UpdateNewsDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<News> {
    return this.newsService.update(id, updateNewsDto, files);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiResponse({ status: 200, description: 'Bài viết đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  remove(@Param('id', ParseIntPipe) id: string): Promise<void> {
    return this.newsService.remove(+id);
  }

  @Patch(':id/views')
  @ApiOperation({ summary: 'Tăng số lượt xem bài viết' })
  @ApiResponse({ status: 200, description: 'Số lượt xem đã được tăng', type: News })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  incrementViews(@Param('id', ParseIntPipe) id: number): Promise<News> {
    return this.newsService.incrementViews(id);
  }

  @Patch(':id/like')
  @ApiOperation({ summary: 'Thích bài viết' })
  @ApiResponse({ status: 200, description: 'Đã thích bài viết', type: News })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  likeNews(@Param('id', ParseIntPipe) id: number): Promise<News> {
    return this.newsService.likeNews(id);
  }

  @Patch(':id/unlike')
  @ApiOperation({ summary: 'Bỏ thích bài viết' })
  @ApiResponse({ status: 200, description: 'Đã bỏ thích bài viết', type: News })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  unlikeNews(@Param('id', ParseIntPipe) id: number): Promise<News> {
    return this.newsService.unlikeNews(id);
  }
}
