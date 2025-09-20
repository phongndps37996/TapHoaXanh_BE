import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/Filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { IsAdminGuard } from '../auth/guards/IsAdmin.guard';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @ApiBearerAuth()
  @UseGuards(JwtGuard, IsAdminGuard)
  @Post()
  @ApiConsumes('multipart/form-data') // Cho phép swagger gửi form-data
  @ApiBody({ type: CreateProductDto })
  @UseInterceptors(FileInterceptor('images')) // 'image' là tên field trong form-data
  async create(@Body() createProductDto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
    return this.productsService.create(createProductDto, file);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('/latest')
  getLatestProducts() {
    return this.productsService.getLatestProducts();
  }

  @Get('/slug/:slug')
  getDetailProduct(@Param('slug') slug: string) {
    return this.productsService.getDetailProduct(slug);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('top-purchased')
  getTopPurchased(@Query('limit') limit?: number) {
    const l = Number(limit) || 5;
    return this.productsService.getTopPurchasedProducts(l);
  }

  @Get('filter-null-cate')
  getAllProductNullCate() {
    return this.productsService.getAllProductNullCate();
  }

  // @ApiBearerAuth()
  // @UseGuards(JwtGuard, IsAdminGuard)
  @Get('search')
  async Search(@Query() query: ProductFilterDto) {
    return this.productsService.filterProducts(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productsService.productDetail(id);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('cate/:id')
  findByCategory(@Param('id') id: number) {
    return this.productsService.findByCategory(id);
  }

  @Patch('restore/:id')
  restore(@Param('id') id: number) {
    return this.productsService.restore(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, IsAdminGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('images')) // 'images' là tên field file trong form-data
  update(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File, // ? vì file có thể không gửi
  ) {
    return this.productsService.update(id, updateProductDto, file);
  }

  @Delete('by-cate/:id')
  removeByCategoryId(@Param('id') id: number) {
    return this.productsService.removeByCategoryId(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productsService.remove(+id);
  }
}
