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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Public } from '../../public.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/Filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @ApiBearerAuth()
  @Post()
  @ApiConsumes('multipart/form-data') // Cho phép swagger gửi form-data
  @ApiBody({ type: CreateProductDto })
  @UseInterceptors(FileInterceptor('images')) // 'image' là tên field trong form-data
  async create(@Body() createProductDto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
    return this.productsService.create(createProductDto, file);
  }

  @Public()
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Public()
  @Get('/latest')
  getLatestProducts() {
    return this.productsService.getLatestProducts();
  }

  @Public()
  @Get('/slug/:slug')
  getDetailProduct(@Param('slug') slug: string) {
    return this.productsService.getDetailProduct(slug);
  }

  @Get('top-purchased')
  getTopPurchased(@Query('limit') limit?: number) {
    const l = Number(limit) || 5;
    return this.productsService.getTopPurchasedProducts(l);
  }

  @Public()
  @Get('search')
  async Search(@Query() query: ProductFilterDto) {
    return this.productsService.filterProducts(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productsService.productDetail(id);
  }

  @Public()
  @Get('cate/:id')
  findByCategory(@Param('id') id: number) {
    return this.productsService.findByCategory(id);
  }

  @Patch('restore/:id')
  restore(@Param('id') id: number) {
    return this.productsService.restore(id);
  }

  @Patch(':id')
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

  @Public()
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productsService.remove(+id);
  }
}
