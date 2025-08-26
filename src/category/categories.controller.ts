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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiConsumes('multipart/form-data') // Cho phép swagger gửi form-data
  @ApiBody({ type: CreateCategoryDto })
  @UseInterceptors(FileInterceptor('files')) // Sử dụng Express FileInterceptor
  create(@Body() createCategoryDto: CreateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    console.log(22222);
    return this.categoriesService.create(createCategoryDto, file);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('files')) // Sử dụng Express FileInterceptor
  update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File, // ? vì file có thể không gửi
  ) {
    return this.categoriesService.update(+id, updateCategoryDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
