import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Inject,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ICloudinaryService } from './interfaces/icloudinary-service.interface';
import { ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(@Inject(ICloudinaryService) private readonly cloudinaryService: ICloudinaryService) {}

  /**
   * Upload file avatar (chỉ 1 file)
   */
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('upload/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh đại diện (jpg, jpeg, png, gif, webp)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.cloudinaryService.uploadFile(file, {
        fileType: 'avatar',
      });
      return {
        success: true,
        data: result,
        message: 'Upload ảnh đại diện thành công',
        folder: 'avatars',
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi upload ảnh đại diện: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Upload nhiều file chung cho product và category
   */
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('upload-multiple')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'fileType',
    description: 'Loại file để phân loại vào thư mục',
    enum: ['product', 'category'],
    required: true,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách files cần upload (tối đa 10 files)',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Tối đa 10 file
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB mỗi file
          new FileTypeValidator({ fileType: /^image/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Query('fileType') fileType: 'product' | 'category',
  ) {
    try {
      const results = await this.cloudinaryService.uploadMultipleFiles(files, {
        fileType: fileType,
      });

      const folderName = fileType === 'product' ? 'products' : 'categories';
      const typeName = fileType === 'product' ? 'sản phẩm' : 'danh mục';

      return {
        success: true,
        data: results,
        message: `Upload thành công ${files.length} ảnh ${typeName}`,
        folder: folderName,
        fileType: fileType,
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi upload nhiều ảnh: ${(error as Error).message}`,
      };
    }
  }
}
