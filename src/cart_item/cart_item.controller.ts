import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ICartItemService } from './interfaces/icart_item-service.interface';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('cart-item')
export default class CartItemController {
  constructor(private readonly cartItemService: ICartItemService) {}
  @ApiOperation({ summary: 'Lấy tất cả sản phẩm trong giỏ hàng' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get()
  async findAll() {
    return await this.cartItemService.findAll();
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartItemDto: UpdateCartItemDto) {
  //   return this.cartItemService.update(+id, updateCartItemDto);
  // }
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartItemService.remove(+id);
  }
}
