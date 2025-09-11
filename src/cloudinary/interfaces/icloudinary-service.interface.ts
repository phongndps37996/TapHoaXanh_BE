import { CloudinaryResponse } from '../cloudinary-response';

export type FileType = 'product' | 'category' | 'avatar' | 'news';
export abstract class ICloudinaryService {
  abstract uploadFile(
    file: Express.Multer.File,
    options?: {
      folder?: string;
      public_id?: string;
      transformation?: any[];
      fileType?: FileType;
    },
  ): Promise<CloudinaryResponse>;

  abstract uploadMultipleFiles(
    files: Express.Multer.File[],
    options?: {
      folder?: string;
      fileType?: FileType;
    },
  ): Promise<CloudinaryResponse[]>;

  abstract deleteFile(publicId: string): Promise<any>;

  abstract deleteMultipleFiles(publicIds: string[]): Promise<any[]>;

  abstract generateUrl(publicId: string, transformation?: any[]): string;

  abstract getImageInfo(publicId: string): Promise<any>;

  abstract createFolderIfNotExists(folderName: string): Promise<void>;
}
