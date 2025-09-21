import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderService } from './order.service';
import { IsAdminGuard } from '../auth/guards/IsAdmin.guard';

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
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('owned')
  findAllOwned(@Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.findAllOwned(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('owned-paginated')
  findOwnedOrdersPaginated(@Req() req: any, @Query() query: PaginatedOrdersDto) {
    const userId = req.user.sub;
    return this.orderService.findOwnedOrdersPaginated(userId, query);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/revenue')
  getTotalRevenueSuccess(@Query('year') year?: string, @Query('month') month?: string) {
    const y = Number(year) || new Date().getFullYear();
    const m = month ? parseInt(month, 10) : undefined;
    return this.orderService.getTotalRevenueSuccess(y, m);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/view-detail/:orderCode')
  getOrderDetailByCode(@Param('orderCode') orderCode: string) {
    return this.orderService.getOrderDetailByCode(orderCode);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/revenue-month')
  getMonthlyRevenueSuccess(@Query('year') year?: string) {
    const y = Number(year) || new Date().getFullYear();
    return this.orderService.getMonthlyRevenueSuccess(y);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/search')
  filterAllOrder(@Query() filter: FilterOrderDto) {
    return this.orderService.filterAllOrder(filter);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/count')
  countNumberOfOrder(@Query('year') year?: string, @Query('month') month?: string) {
    const y = Number(year) || new Date().getFullYear();
    const m = month ? parseInt(month, 10) : undefined;
    return this.orderService.countNumberOfOrder(y, m);
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
