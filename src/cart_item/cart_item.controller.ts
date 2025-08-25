import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ICartItemService } from './interfaces/icart_item-service.interface';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('cart-item')
export default class CartItemController {
  constructor(private readonly cartItemService: ICartItemService) {}

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
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartItemService.remove(+id);
  }
}
