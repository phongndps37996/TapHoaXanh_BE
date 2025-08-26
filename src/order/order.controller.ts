import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.create(createOrderDto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('from-cart')
  createFromCart(@Body() createOrderDto: CreateOrderFromCartDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.createOrderFromCart(createOrderDto, userId);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get('/revenue')
  getTotalRevenueSuccess() {
    return this.orderService.getTotalRevenueSuccess();
  }

  @Get('/revenue-month')
  getMonthlyRevenueSuccess(@Query('year') year?: string) {
    const y = Number(year) || new Date().getFullYear();
    return this.orderService.getMonthlyRevenueSuccess(y);
  }

  @Get('/search')
  filterAllOrder(@Query() filter: FilterOrderDto) {
    return this.orderService.filterAllOrder(filter);
  }

  @Get('/count')
  countNumberOfOrder() {
    return this.orderService.countNumberOfOrder();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
