// cart.controller.ts
import { Controller, Post, Body, Req, UseGuards, Get, Put, Delete } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddMultipleCartItemsDto } from './dto/add-multiple-cart-items.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ICartService } from './interfaces/icart-service.interface';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: ICartService) {}

  @ApiBearerAuth()
  @Post('add')
  @UseGuards(JwtGuard)
  async addToCart(@Req() req: any, @Body() dto: CreateCartDto): Promise<any> {
    const userId = req.user.sub;
    const result = await this.cartService.addToCart(userId, dto.productId, dto.quantity);
    return result;
  }

  @ApiBearerAuth()
  @Get('owned')
  @UseGuards(JwtGuard)
  async getOwnedCart(@Req() req: any): Promise<any> {
    return await this.cartService.FindOrCreateCart(req.user.sub);
  }

  @ApiOperation({
    summary: 'Cập nhật giỏ hàng',
  })
  @ApiBearerAuth()
  @Put('update')
  @UseGuards(JwtGuard)
  async updateCart(@Req() req: any, @Body() dto: UpdateCartDto): Promise<any> {
    const userId = req.user.sub;
    const result = await this.cartService.updateCart(
      userId,
      dto.productId,
      dto.action === 'update' ? (dto.quantity as number) : 1,
      dto.action || 'update',
    );
    return result;
  }

  // Removed update-delta; handled by update with action in DTO

  @ApiOperation({ summary: 'Thêm nhiều sản phẩm vào giỏ hàng cùng lúc' })
  @ApiBearerAuth()
  @Post('add-multiple')
  @UseGuards(JwtGuard)
  async addMultipleCart(@Req() req: any, @Body() dto: AddMultipleCartItemsDto): Promise<any> {
    const userId = req.user.sub;
    return await this.cartService.addMultipleCart(userId, dto.items as Array<{ productId: number; quantity: number }>);
  }

  @ApiOperation({ summary: 'Xóa toàn bộ sản phẩm trong giỏ hàng' })
  @ApiBearerAuth()
  @Delete('clear')
  @UseGuards(JwtGuard)
  async clearCartItems(@Req() req: any): Promise<any> {
    const userId = req.user.sub;
    return await this.cartService.clearCartItems(userId);
  }
}
