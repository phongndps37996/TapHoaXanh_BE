import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Users } from '../entities/users.entity';
import { IUsersService } from '../interfaces/iusers-service.interface';
import { IUsersRepository } from '../interfaces/iusers-repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdatePasswordDto } from '../dto/updatePassword-user.dto';
import { plainToInstance } from 'class-transformer';
import { ProfileDto } from '../dto/profile-user.dto';
import { FilterUserDto } from '../dto/filter-user.dto';
import { PaginationResult } from '../../interface/IPagination';
import { ICloudinaryService } from '../../cloudinary/interfaces/icloudinary-service.interface';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly _usersRepository: IUsersRepository,
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  // async createUser(registerDto: RegisterAuthDto): Promise<Users> {
  //   const existing = await this._usersRepository.findByEmail(registerDto.email);
  //   if (existing) throw new ConflictException('Email đã tồn tại');
  //   const hashedPassword = await bcrypt.hash(registerDto.password, 10);
  //   return this._usersRepository.createUser({ ...registerDto, password: hashedPassword, role: 'user' });
  // }
  async findAll(): Promise<Users[]> {
    return await this._usersRepository.findAll();
  }
  async findByEmail(email: string): Promise<Users | null> {
    return await this._usersRepository.findByEmail(email);
  }

  async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Kiểm tra mật khẩu cũ
    const isOldPasswordValid = await bcrypt.compare(updatePasswordDto.oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }
    // Kiểm tra xác nhận mật khẩu
    if (updatePasswordDto.newPassword !== updatePasswordDto.confirmPassword) {
      throw new BadRequestException('Mật khẩu không khớp với mật khẩu mới');
    }
    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    await this._usersRepository.updatePassword(user.email, hashedPassword);
    return true;
  }

  async findById(id: number): Promise<Users | null> {
    const user = await this._usersRepository.findById(id);

    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  async updateUserInformation(id: number, updateUserDto: UpdateUserDto): Promise<Users | null> {
    await this.findById(id);
    return await this._usersRepository.updateUser(id, updateUserDto);
  }

  async getUserInformation(id: number): Promise<ProfileDto | null> {
    const user = await this._usersRepository.findById(id);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return plainToInstance(ProfileDto, user);
  }

  async filterAllUser(userDto: FilterUserDto): Promise<PaginationResult<Users>> {
    return await this._usersRepository.filterUser(userDto);
  }

  async updateAvatar(userId: number, file: Express.Multer.File): Promise<Users | null> {
    console.log('updateAvatar');
    // Kiểm tra user có tồn tại không
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    try {
      console.log('updateAvatar try');
      // Upload file lên Cloudinary
      const cloudinaryResult = await this.cloudinaryService.uploadFile(file, {
        fileType: 'avatar',
      });

      // Cập nhật URL avatar mới vào database sử dụng repository method
      const updatedUser = await this._usersRepository.updateAvatar(userId, cloudinaryResult.secure_url);

      return updatedUser;
    } catch (error) {
      console.log('updateAvatar catch');
      throw new BadRequestException(`Lỗi upload avatar: ${(error as Error).message}`);
    }
  }
  async countNumberOfUser(): Promise<number> {
    return await this._usersRepository.countNumberOfUser();
  }
}
