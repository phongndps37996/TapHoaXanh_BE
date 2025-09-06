import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsAdminGuard } from 'src/auth/guards/IsAdmin.guard';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtGuard, IsAdminGuard)
  @ApiConsumes('multipart/form-data') // Cho phép swagger gửi form-data
  @ApiBody({ type: CreateCategoryDto })
  @UseInterceptors(FileInterceptor('files')) // Sử dụng Express FileInterceptor
  create(@Body() createCategoryDto: CreateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    return this.categoriesService.create(createCategoryDto, file);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('search')
  getCategoriesWithPagination(@Query() filter: FilterCategoryDto) {
    return this.categoriesService.getCategoriesWithPagination(filter);
  }

  @Patch('restore/:id')
  restore(@Param('id') id: number) {
    return this.categoriesService.restore(id);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, IsAdminGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('files')) // Sử dụng Express FileInterceptor
  update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File, // ? vì file có thể không gửi
  ) {
    return this.categoriesService.update(+id, updateCategoryDto, file);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
