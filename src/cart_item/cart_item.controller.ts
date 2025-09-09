import { Controller, Get, UseGuards } from '@nestjs/common';
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

  // @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng' })
  // @ApiBearerAuth()
  // @UseGuards(JwtGuard)
  // @Put(':id')
  // updateItem(@Param('id') id: number, @Body() updateQuantityDto: UpdateQuantityDto, @Req() req: any) {
  //   return this.cartItemService.updateItem(req.user.sub, id, updateQuantityDto.quantity);
  // }
  // @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  // @UseGuards(JwtGuard)
  // @ApiBearerAuth()
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.cartItemService.remove(+id);
  // }
}
