import { CloudinaryResponse } from '../cloudinary-response';
import { FileType } from './icloudinary-service.interface';

export abstract class ICloudinaryRepository {
  abstract uploadToCloudinary(
    file: Buffer,
    options?: {
      folder?: string;
      public_id?: string;
      transformation?: any[];
      fileType?: FileType;
    },
  ): Promise<CloudinaryResponse>;

  abstract deleteFromCloudinary(publicId: string): Promise<any>;

  abstract getCloudinaryInfo(publicId: string): Promise<any>;

  abstract createFolderIfNotExists(folderName: string): Promise<void>;
}
