import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/updatePassword-user.dto';
import { IUsersService } from './interfaces/iusers-service.interface';
import { UploadAvatarResponseDto } from './dto/upload-avatar.dto';
import { IsAdminGuard } from 'src/auth/guards/IsAdmin.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: IUsersService) {}

  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.usersService.createUser(createUserDto);
  // }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/count')
  countNumberOfUser() {
    return this.usersService.countNumberOfUser();
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('search')
  async filterAllUser(@Query() userDto: FilterUserDto) {
    return this.usersService.filterAllUser(userDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('profile')
  async findLogined(@Req() req: any) {
    return await this.usersService.getUserInformation(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Put()
  async update(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.updateUserInformation(req.user.sub, updateUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch(':id')
  async updateUserById(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.updateUserInformation(id, updateUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Put('password')
  @ApiResponse({ status: 200, description: 'Cập nhật mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu cũ không đúng hoặc xác nhận mật khẩu không khớp' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async updatePassword(@Req() req: any, @Body() updatePasswordDto: UpdatePasswordDto) {
    const result = await this.usersService.updatePassword(req.user.sub, updatePasswordDto);
    return {
      message: 'Cập nhật mật khẩu thành công',
      success: result,
    };
  }

  /**
   * Upload avatar cho user đang đăng nhập
   */
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh đại diện (jpg, jpeg, png, gif, webp)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload avatar thành công',
    type: UploadAvatarResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File không hợp lệ hoặc lỗi upload' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
        errorHttpStatusCode: 400,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }

    try {
      const result = await this.usersService.updateAvatar(req.user.sub, file);
      if (!result) {
        throw new BadRequestException('Không thể cập nhật avatar');
      }

      return {
        success: true,
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          image: result.image || '',
          role: result.role || 'USER',
        },
        message: 'Cập nhật avatar thành công',
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi cập nhật avatar: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Upload avatar cho user theo ID (admin)
   */
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post(':id/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh đại diện (jpg, jpeg, png, gif, webp)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload avatar thành công',
    type: UploadAvatarResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File không hợp lệ hoặc lỗi upload' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatarById(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
        errorHttpStatusCode: 400,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException('ID user không hợp lệ');
    }

    try {
      const result = await this.usersService.updateAvatar(userId, file);
      if (!result) {
        throw new BadRequestException('Không thể cập nhật avatar');
      }

      return {
        success: true,
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          image: result.image || '',
          role: result.role || 'USER',
        },
        message: 'Cập nhật avatar thành công',
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi cập nhật avatar: ${(error as Error).message}`,
      };
    }
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   // return this.usersService.delete(+id);
  // }
}
