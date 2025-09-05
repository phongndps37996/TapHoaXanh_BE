import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ICloudinaryService } from '../cloudinary/interfaces/icloudinary-service.interface';
import { ProductRepository } from '../products/products.repository';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImagesRepository } from './prduct-images.repository';

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly productImagesRepository: ProductImagesRepository,
    private readonly productRepository: ProductRepository,
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async create(createProductImageDto: CreateProductImageDto, images: Express.Multer.File[]) {
    const product = await this.productRepository.findById(createProductImageDto.productId);
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // Gọi upload file
    const cloudinaryResult = await this.cloudinaryService.uploadMultipleFiles(images, {
      fileType: 'product',
    });

    if (!cloudinaryResult || !Array.isArray(cloudinaryResult)) {
      throw new InternalServerErrorException('Upload ảnh thất bại');
    }

    const listImage = cloudinaryResult.map((file) =>
      this.productImagesRepository.create({
        product: product,
        image_url: file.secure_url,
      }),
    );

    return await this.productImagesRepository.saveMultiple(listImage);
  }

  async findAll() {
    return await this.productImagesRepository.getAllProductImages();
  }

  async findOne(id: number) {
    const productImage = await this.productImagesRepository.findById(id);
    if (!productImage) throw new NotFoundException('Hình ảnh sản phẩm không tồn tại');
    return productImage;
  }

  async update(id: number, updateProductImageDto: UpdateProductImageDto) {
    const productImage = await this.productImagesRepository.findById(id);
    if (!productImage) throw new NotFoundException('Hình ảnh sản phẩm không tồn tại');
    if (updateProductImageDto.productId) {
      const product = await this.productRepository.findById(updateProductImageDto.productId);
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    }
    const updatedImage = this.productImagesRepository.create({
      ...productImage,
      ...updateProductImageDto,
    });
    return await this.productImagesRepository.save(updatedImage);
  }

  async remove(id: number) {
    const productImage = await this.productImagesRepository.findById(id);
    if (!productImage) throw new NotFoundException('Hình ảnh sản phẩm không tồn tại');
    if (productImage.image_url && productImage.image_url.trim() !== '') {
      this.cloudinaryService.deleteFile(productImage.image_url);
    }

    await this.productImagesRepository.delete(id);

    return {
      message: `Xoá hình ảnh sản phẩm thành công`,
    };
  }

  async removeProductImagesByProductId(id: number) {
    const productImage = await this.productImagesRepository.findAllByProductId(id);
    if (!productImage) throw new NotFoundException('Không tìm thấy hình ảnh của sản phẩm này');
    productImage.map((item) => this.cloudinaryService.deleteFile(item.image_url!));

    await this.productImagesRepository.deleteByProductId(id);

    return {
      message: `Xoá hình ảnh sản phẩm thành công`,
    };
  }
}
