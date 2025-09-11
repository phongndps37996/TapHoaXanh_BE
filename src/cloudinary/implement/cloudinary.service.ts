// cloudinary.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from '../cloudinary-response';
import { FileType, ICloudinaryService } from '../interfaces/icloudinary-service.interface';
import { ICloudinaryRepository } from '../interfaces/icloudinary-repository.interface';

@Injectable()
export class CloudinaryService implements ICloudinaryService {
  constructor(@Inject(ICloudinaryRepository) private readonly cloudinaryRepository: ICloudinaryRepository) {}

  async uploadFile(
    file: Express.Multer.File,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any[];
      fileType?: FileType;
    } = {},
  ): Promise<CloudinaryResponse> {
    return this.cloudinaryRepository.uploadToCloudinary(file.buffer, options);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: {
      folder?: string;
      fileType?: FileType;
    } = {},
  ): Promise<CloudinaryResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId: string): Promise<any> {
    return this.cloudinaryRepository.deleteFromCloudinary(publicId);
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<any[]> {
    const deletePromises = publicIds.map((id) => this.deleteFile(id));
    return Promise.all(deletePromises);
  }

  generateUrl(publicId: string, transformation: any[] = []): string {
    return cloudinary.url(publicId, { transformation });
  }

  async getImageInfo(publicId: string): Promise<any> {
    return this.cloudinaryRepository.getCloudinaryInfo(publicId);
  }

  async createFolderIfNotExists(folderName: string): Promise<void> {
    return this.cloudinaryRepository.createFolderIfNotExists(folderName);
  }
}
