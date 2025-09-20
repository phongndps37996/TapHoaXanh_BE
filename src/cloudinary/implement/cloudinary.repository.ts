import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from '../cloudinary-response';
import { ICloudinaryRepository } from '../interfaces/icloudinary-repository.interface';
import * as streamifier from 'streamifier';
import { extractPublicId } from '../../utils/extract.file';

@Injectable()
export class CloudinaryRepository implements ICloudinaryRepository {
  constructor() {
    // Cấu hình Cloudinary từ environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Tự động phân loại file và upload vào thư mục phù hợp
   */
  async uploadToCloudinary(
    file: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any[];
      fileType?: 'product' | 'category' | 'avatar'; // Thêm fileType để phân loại
    } = {},
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      // Tự động xác định thư mục dựa trên fileType hoặc tên file
      let targetFolder = options.folder;

      if (!targetFolder) {
        if (options.fileType) {
          // Nếu có fileType, sử dụng thư mục tương ứng
          switch (options.fileType) {
            case 'product':
              targetFolder = 'products';
              break;
            case 'category':
              targetFolder = 'categories';
              break;
            case 'avatar':
              targetFolder = 'avatars';
              break;
            default:
              targetFolder = 'taphoaxanh';
          }
        } else {
          // Nếu không có fileType, sử dụng thư mục mặc định
          targetFolder = 'taphoaxanh';
        }
      }

      const uploadOptions = {
        folder: targetFolder,
        ...options,
      };

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result as CloudinaryResponse);
      });

      streamifier.createReadStream(file).pipe(uploadStream);
    });
  }

  async deleteFromCloudinary(url: string): Promise<any> {
    try {
      const publicId = extractPublicId(url);
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Lỗi xóa file: ${(error as Error).message}`);
    }
  }

  async getCloudinaryInfo(publicId: string): Promise<any> {
    try {
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      throw new Error(`Lỗi lấy thông tin file: ${(error as Error).message}`);
    }
  }

  /**
   * Tạo thư mục trên Cloudinary (nếu chưa có)
   */
  async createFolderIfNotExists(folderName: string): Promise<void> {
    try {
      // Cloudinary tự động tạo thư mục khi upload file
      // Không cần gọi API riêng để tạo thư mục
    } catch (error) {
      console.warn(`Không thể tạo thư mục ${folderName}:`, error);
    }
  }
}
