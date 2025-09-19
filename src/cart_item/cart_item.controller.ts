import { Controller, Get, UseGuards, Post, Delete, Body, Req, Inject } from '@nestjs/common';
import { ICartItemService } from './interfaces/icart_item-service.interface';
import { ICartService } from '../cart/interfaces/icart-service.interface';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateCartItemDto } from './dto/create-cart_item.dto';
import { RemoveCartItemsDto } from './dto/remove-cart-items.dto';

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

  // @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  // @UseGuards(JwtGuard)
  // @ApiBearerAuth()
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.cartItemService.remove(+id);
  // }

  @ApiOperation({ summary: 'Xóa nhiều sản phẩm khỏi giỏ hàng theo IDs' })
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete()
  async removeByIds(@Body() dto: RemoveCartItemsDto, @Req() req: any) {
    return this.cartItemService.removeByIds(dto.ids, req.user.sub);
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

  // @ApiOperation({ summary: 'Tăng/giảm số lượng sản phẩm trong giỏ hàng (nút +/-)' })
  // @UseGuards(JwtGuard)
  // @ApiBearerAuth()
  // @Put(':id/quantity')
  // async updateCartItemQuantity(@Param('id') id: string, @Body() dto: UpdateCartItemQuantityDto, @Req() req: any) {
  //   // Lấy cart item để lấy thông tin cart và product
  //   const cartItem = await this.cartItemService.findByIds([+id], req.user.sub);
  //   if (!cartItem || cartItem.length === 0) {
  //     throw new NotFoundException('Cart item không tồn tại');
  //   }

  //   return await this.cartItemService.addOrUpdateCartItem(cartItem[0].cart, cartItem[0].product.id, 1, dto.action);
  // }
}
