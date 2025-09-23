import { Body, Controller, Delete, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ICartService } from '../cart/interfaces/icart-service.interface';
import { CreateCartItemDto } from './dto/create-cart_item.dto';
import { RemoveCartItemsDto } from './dto/remove-cart-items.dto';
import { ICartItemService } from './interfaces/icart_item-service.interface';

@Controller('cart-item')
export default class CartItemController {
  constructor(
    private readonly cartItemService: ICartItemService,
    @Inject(ICartService)
    private readonly cartService: ICartService,
  ) {}

  @ApiOperation({ summary: 'Lấy tất cả sản phẩm trong giỏ hàng' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get()
  async findAll() {
    return await this.cartItemService.findAll();
  }

  @ApiOperation({ summary: 'Xóa nhiều sản phẩm khỏi giỏ hàng theo IDs' })
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete()
  async removeByIds(@Body() dto: RemoveCartItemsDto, @Req() req: any) {
    return this.cartItemService.removeByIds(dto.ids, req.user.sub);
  }

  @ApiOperation({ summary: 'Xóa một sản phẩm khỏi giỏ hàng theo ID' })
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete(':id')
  async removeById(@Param('id') id: string) {
    return this.cartItemService.remove(+id);
  }

  @ApiOperation({ summary: 'Thêm hoặc cập nhật sản phẩm trong giỏ hàng' })
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post()
  async addOrUpdateCartItem(@Body() dto: CreateCartItemDto, @Req() req: any) {
    const userId = req.user.sub;
    const cart = await this.cartService.FindOrCreateCart(userId);
    return await this.cartItemService.addOrUpdateCartItem(cart, [dto.productId], dto.quantity, dto.action || 'add');
  }
}
